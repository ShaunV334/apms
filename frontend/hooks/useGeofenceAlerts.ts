import { useEffect, useMemo, useRef } from "react";
import { sendGeofenceAlert } from "../services/notificationService";
import { useGeofenceSettings, haversineMetres } from "./useGeofenceSettings";
import { useLatestWatchLocation } from "./useWatchLocation";

const ALERT_COOLDOWN_MS = 2 * 60 * 1000;

function formatDistance(metres: number): string {
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(2)} km`;
  }
  return `${Math.round(metres)} m`;
}

export function useGeofenceAlerts(): void {
  const { settings } = useGeofenceSettings();
  const { location } = useLatestWatchLocation();

  const previousOutOfZoneRef = useRef<boolean | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const state = useMemo(() => {
    if (!location || settings.homeLatitude === null || settings.homeLongitude === null) {
      return {
        hasGeofence: false,
        distance: null as number | null,
        outOfZone: false,
      };
    }

    const distance = haversineMetres(
      settings.homeLatitude,
      settings.homeLongitude,
      location.latitude,
      location.longitude
    );

    return {
      hasGeofence: true,
      distance,
      outOfZone: distance > settings.radius,
    };
  }, [location, settings.homeLatitude, settings.homeLongitude, settings.radius]);

  useEffect(() => {
    if (!state.hasGeofence || state.distance === null) {
      previousOutOfZoneRef.current = null;
      return;
    }

    const wasOutOfZone = previousOutOfZoneRef.current;
    previousOutOfZoneRef.current = state.outOfZone;

    if (wasOutOfZone === null) return;
    if (wasOutOfZone || !state.outOfZone) return;

    const now = Date.now();
    if (now - lastAlertTimeRef.current < ALERT_COOLDOWN_MS) return;

    sendGeofenceAlert(
      "🚧 Geofence Breach",
      `Patient moved ${formatDistance(state.distance)} from safe zone centre (radius ${settings.radius} m).`
    );

    lastAlertTimeRef.current = now;
  }, [settings.radius, state.distance, state.hasGeofence, state.outOfZone]);
}
