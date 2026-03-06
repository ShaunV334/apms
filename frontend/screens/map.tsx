import { Ionicons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { styles } from "../styles/map.styles";

// MapLibre does not use Mapbox tokens — suppress the warning
MapLibreGL.setAccessToken(null);

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

/** Haversine distance in metres between two lat/lng points */
function haversineMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

// ─── constants ────────────────────────────────────────────────────────────────

const MIN_RADIUS = 50;   // metres
const MAX_RADIUS = 1000; // metres
const THUMB_SIZE = 22;

// ─── component ────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const { theme } = useUnistyles();
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  // location + permission
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [patientCoord, setPatientCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // safe zone
  const [homeCoord, setHomeCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radius, setRadius] = useState(200); // metres

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
    new Animated.Value((radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS))
  ).current;
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const startRatioRef = useRef(0);
  const liveRadiusRef = useRef(radius);

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
        liveRadiusRef.current = Math.round(MIN_RADIUS + newRatio * (MAX_RADIUS - MIN_RADIUS));
      },
      onPanResponderRelease: () => {
        setRadius(liveRadiusRef.current);
      },
    })
  ).current;

  // ── permission + watch position ──────────────────────────────────────────

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    })();
  }, []);

  useEffect(() => {
    if (permissionStatus !== Location.PermissionStatus.GRANTED) return;

    let sub: Location.LocationSubscription | null = null;

    (async () => {
      // Get quick initial fix
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        const coord = {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        };
        setPatientCoord(coord);
        if (!homeCoord) setHomeCoord(coord);
        cameraRef.current?.setCamera({
          centerCoordinate: [coord.longitude, coord.latitude],
          zoomLevel: 14,
          animationDuration: 600,
        });
      }

      // Continuous watch
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // update every 5 m moved
          timeInterval: 5000,
        },
        (loc) => {
          const coord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setPatientCoord(coord);
        }
      );
    })();

    return () => { sub?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  // ── set home to current position ────────────────────────────────────────

  function setHomeHere() {
    if (!patientCoord) return;
    setHomeCoord({ ...patientCoord });
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

  // ── permission gate ──────────────────────────────────────────────────────

  if (permissionStatus !== Location.PermissionStatus.GRANTED) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="location" size={36} color={theme.colors.blue} />
          </View>
          <Text style={styles.permissionTitle}>Location Permission Needed</Text>
          <Text style={styles.permissionSub}>
            APMS needs access to location to monitor the patient's safe zone and
            alert you when they wander too far.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Allow Location</Text>
          </TouchableOpacity>
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
        styleJSON={BLANK_MAP_STYLE}
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
        <TouchableOpacity style={styles.setZoneButton} onPress={setHomeHere}>
          <Ionicons name="home" size={18} color={theme.colors.white} />
          <Text style={styles.setZoneButtonText}>Set Safe Zone to Current Location</Text>
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </View>
    </View>
  );
}
