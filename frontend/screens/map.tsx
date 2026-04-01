import { Ionicons } from "@expo/vector-icons";
import * as MapLibreGL from "@maplibre/maplibre-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    LayoutChangeEvent,
    PanResponder,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import {
  DEFAULT_GEOFENCE_RADIUS,
  MAX_GEOFENCE_RADIUS,
  MIN_GEOFENCE_RADIUS,
  useGeofenceSettings,
  haversineMetres,
} from "../hooks/useGeofenceSettings";
import { useLatestWatchLocation } from "../hooks/useWatchLocation";
import { styles } from "../styles/map.styles";

// Blank base style — OSM tiles are added as a RasterSource layer
const BLANK_MAP_STYLE = JSON.stringify({
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e8e8e8" } }],
});

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build a GeoJSON Polygon that approximates a circle (for MapLibre ShapeSource) */
function buildCircleGeoJSON(
  center: { latitude: number; longitude: number },
  radiusMetres: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const dX = radiusMetres / (111320 * Math.cos((center.latitude * Math.PI) / 180));
  const dY = radiusMetres / 110540;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    coords.push([center.longitude + dX * Math.cos(theta), center.latitude + dY * Math.sin(theta)]);
  }
  coords.push(coords[0]); // close ring
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

// ─── constants ────────────────────────────────────────────────────────────────
const THUMB_SIZE = 22;

// ─── component ────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const { theme } = useUnistyles();
  const cameraRef = useRef<MapLibreGL.CameraRef | null>(null);
  const hasCenteredRef = useRef(false);
  const {
    location: watchLocation,
    loading: watchLocationLoading,
    error: watchLocationError,
  } = useLatestWatchLocation();
  const {
    settings: geofenceSettings,
    loading: geofenceLoading,
    error: geofenceError,
    canEdit,
    saveSettings,
  } = useGeofenceSettings();

  const patientCoord = watchLocation
    ? { latitude: watchLocation.latitude, longitude: watchLocation.longitude }
    : null;

  // safe zone
  const [homeCoord, setHomeCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radius, setRadius] = useState(DEFAULT_GEOFENCE_RADIUS); // metres

  // derived
  const distanceFromHome =
    patientCoord && homeCoord
      ? haversineMetres(
          homeCoord.latitude, homeCoord.longitude,
          patientCoord.latitude, patientCoord.longitude
        )
      : null;
  const outOfZone =
    distanceFromHome !== null && distanceFromHome > radius;

  // slider — ratio based (0 = MIN_RADIUS, 1 = MAX_RADIUS)
  const sliderRatio = useRef(
    new Animated.Value(
      (DEFAULT_GEOFENCE_RADIUS - MIN_GEOFENCE_RADIUS) /
        (MAX_GEOFENCE_RADIUS - MIN_GEOFENCE_RADIUS)
    )
  ).current;
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const startRatioRef = useRef(0);
  const liveRadiusRef = useRef(radius);

  useEffect(() => {
    const nextHome =
      geofenceSettings.homeLatitude !== null && geofenceSettings.homeLongitude !== null
        ? {
            latitude: geofenceSettings.homeLatitude,
            longitude: geofenceSettings.homeLongitude,
          }
        : null;

    setHomeCoord(nextHome);
    setRadius(geofenceSettings.radius);
    liveRadiusRef.current = geofenceSettings.radius;
    sliderRatio.setValue(
      (geofenceSettings.radius - MIN_GEOFENCE_RADIUS) /
        (MAX_GEOFENCE_RADIUS - MIN_GEOFENCE_RADIUS)
    );
  }, [
    geofenceSettings.homeLatitude,
    geofenceSettings.homeLongitude,
    geofenceSettings.radius,
    sliderRatio,
  ]);

  function onTrackLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // capture ratio at the moment the finger touches down
        startRatioRef.current = (sliderRatio as any).__getValue();
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidthRef.current;
        if (tw === 0) return;
        const newRatio = Math.min(1, Math.max(0, startRatioRef.current + gs.dx / tw));
        sliderRatio.setValue(newRatio);
        liveRadiusRef.current = Math.round(
          MIN_GEOFENCE_RADIUS + newRatio * (MAX_GEOFENCE_RADIUS - MIN_GEOFENCE_RADIUS)
        );
      },
      onPanResponderRelease: () => {
        const nextRadius = liveRadiusRef.current;
        setRadius(nextRadius);
        if (canEdit) {
          saveSettings({ radius: nextRadius }).catch((err) => {
            console.error("Failed to save geofence radius:", err);
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!patientCoord) return;

    if (!homeCoord) {
      setHomeCoord(patientCoord);
      if (!geofenceLoading && canEdit) {
        saveSettings({
          homeLatitude: patientCoord.latitude,
          homeLongitude: patientCoord.longitude,
        }).catch((err) => {
          console.error("Failed to save default geofence home:", err);
        });
      }
    }

    if (hasCenteredRef.current) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [patientCoord.longitude, patientCoord.latitude],
      zoomLevel: 14,
      animationDuration: 600,
    });
    hasCenteredRef.current = true;
  }, [patientCoord, homeCoord, geofenceLoading, canEdit, saveSettings]);

  // ── set home to current position ────────────────────────────────────────

  function setHomeHere() {
    if (!patientCoord) return;
    const nextHome = { ...patientCoord };
    setHomeCoord(nextHome);
    if (!canEdit) return;

    saveSettings({
      homeLatitude: nextHome.latitude,
      homeLongitude: nextHome.longitude,
    }).catch((err) => {
      console.error("Failed to save geofence home:", err);
    });
  }

  // ── centre map on patient ────────────────────────────────────────────────

  function centreOnPatient() {
    if (!patientCoord) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [patientCoord.longitude, patientCoord.latitude],
      zoomLevel: 14,
      animationDuration: 600,
    });
  }

  // ── derived values (must stay above any early return) ─────────────────────

  const defaultCenter: [number, number] = patientCoord
    ? [patientCoord.longitude, patientCoord.latitude]
    : [76.726587, 9.728050];

  // Memoize the circle GeoJSON so it only rebuilds when center/radius change
  const safeZoneShape = useMemo(
    () => homeCoord ? buildCircleGeoJSON(homeCoord, radius) : null,
    [homeCoord, radius],
  );

  // Interpolations are recomputed each render so trackWidth is always fresh
  const fillPercent = sliderRatio.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });
  const thumbLeft = sliderRatio.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, trackWidth - THUMB_SIZE)],
    extrapolate: "clamp",
  });

  // ── watch GPS waiting state ──────────────────────────────────────────────

  if (watchLocationLoading || geofenceLoading || !patientCoord) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="location" size={36} color={theme.colors.blue} />
          </View>
          <Text style={styles.permissionTitle}>Waiting for Watch GPS</Text>
          <Text style={styles.permissionSub}>
            Turn on the watch outdoors and wait for a Neo-6M GPS fix. The map
            and geofence will update automatically when the watch uploads location.
          </Text>
          {!!watchLocationError && (
            <Text style={styles.permissionSub}>Data error: {watchLocationError}</Text>
          )}
          {!!geofenceError && (
            <Text style={styles.permissionSub}>Geofence error: {geofenceError}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── main map UI ──────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      {/* Out-of-zone banner */}
      {outOfZone && (
        <SafeAreaView edges={["top"]} style={styles.outOfZoneBanner}>
          <Ionicons name="warning" size={22} color={theme.colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.outOfZoneBannerText}>
              PATIENT OUTSIDE SAFE ZONE!
            </Text>
            <Text style={styles.outOfZoneBannerSub}>
              {distanceFromHome !== null ? formatDistance(distanceFromHome) : "—"} from home ·{" "}
              {Math.round(radius)} m zone
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* Map */}
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={BLANK_MAP_STYLE}
        logoEnabled={false}
        attributionEnabled
        compassEnabled
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: defaultCenter, zoomLevel: 14 }}
        />

        {/* OpenStreetMap tiles */}
        <MapLibreGL.RasterSource
          id="osm"
          tileUrlTemplates={["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]}
          tileSize={256}
          maxZoomLevel={19}
        >
          <MapLibreGL.RasterLayer id="osmLayer" style={{ rasterOpacity: 1 }} />
        </MapLibreGL.RasterSource>

        {/* Safe-zone circle (fill + stroke) */}
        {safeZoneShape && (
          <MapLibreGL.ShapeSource id="safeZone" shape={safeZoneShape}>
            <MapLibreGL.FillLayer
              id="safeZoneFill"
              style={{
                fillColor: outOfZone ? "rgba(229,57,53,0.12)" : "rgba(30,136,229,0.12)",
                fillOpacity: 1,
              }}
            />
            <MapLibreGL.LineLayer
              id="safeZoneLine"
              style={{
                lineColor: outOfZone ? theme.colors.red : theme.colors.blue,
                lineWidth: 2,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Home / safe-zone marker */}
        {homeCoord && (
          <MapLibreGL.PointAnnotation
            id="homeMarker"
            coordinate={[homeCoord.longitude, homeCoord.latitude]}
            title="Safe Zone Centre"
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.colors.blue,
                borderWidth: 3,
                borderColor: theme.colors.white,
                elevation: 4,
              }}
            />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Patient marker */}
        {patientCoord && (
          <MapLibreGL.PointAnnotation
            id="patientMarker"
            coordinate={[patientCoord.longitude, patientCoord.latitude]}
            title="Patient"
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: outOfZone ? theme.colors.red : theme.colors.green,
                borderWidth: 3,
                borderColor: theme.colors.white,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 6,
              }}
            >
              <Ionicons name="person" size={20} color={theme.colors.white} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* Floating header */}
      {!outOfZone && (
        <View
          style={[
            styles.headerOverlay,
            { top: outOfZone ? 70 : 12 },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Patient Location</Text>
            <Text style={styles.headerSubtitle}>Jane Doe</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { borderWidth: 1.5, borderColor: outOfZone ? theme.colors.red : theme.colors.green },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: outOfZone ? theme.colors.red : theme.colors.green },
              ]}
            />
            <Text style={styles.statusPillText}>
              {outOfZone ? "Out of zone" : "Safe Zone"}
            </Text>
          </View>
        </View>
      )}

      {/* Locate button */}
      <TouchableOpacity
        onPress={centreOnPatient}
        style={{
          position: "absolute",
          right: 16,
          bottom: 260,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.colors.white,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons name="locate" size={22} color={theme.colors.blue} />
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />

        {/* Radius row */}
        <View style={styles.panelRow}>
          <Text style={styles.panelLabel}>Safe Zone Radius</Text>
          <Text style={styles.panelValue}>{radius} m</Text>
        </View>

        {/* Custom Slider */}
        <View
          style={[styles.radiusSliderTrack, { width: "100%" }]}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[styles.radiusSliderFill, { width: fillPercent }]}
          />
          <Animated.View
            style={[styles.radiusSliderThumb, { left: thumbLeft }]}
          />
        </View>

        {/* Info cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text
              style={[
                styles.infoCardValue,
                { color: outOfZone ? theme.colors.red : theme.colors.green },
              ]}
            >
              {distanceFromHome !== null ? formatDistance(distanceFromHome) : "—"}
            </Text>
            <Text style={styles.infoCardLabel}>Distance from Home</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardValue}>{radius} m</Text>
            <Text style={styles.infoCardLabel}>Safe Radius</Text>
          </View>
          <View style={styles.infoCard}>
            <Text
              style={[
                styles.infoCardValue,
                { color: outOfZone ? theme.colors.red : theme.colors.green },
              ]}
            >
              {outOfZone ? "ALERT" : "Safe"}
            </Text>
            <Text style={styles.infoCardLabel}>Status</Text>
          </View>
        </View>

        {/* Set home button */}
        <TouchableOpacity
          style={[styles.setZoneButton, !canEdit && { opacity: 0.6 }]}
          onPress={setHomeHere}
          disabled={!canEdit}
        >
          <Ionicons name="home" size={18} color={theme.colors.white} />
          <Text style={styles.setZoneButtonText}>
            {canEdit ? "Set Safe Zone to Current Location" : "Safe Zone is read-only"}
          </Text>
        </TouchableOpacity>
        {!!geofenceError && <Text style={styles.permissionSub}>Geofence error: {geofenceError}</Text>}
        <View style={{ height: 80 }} />
      </View>
    </View>
  );
}
