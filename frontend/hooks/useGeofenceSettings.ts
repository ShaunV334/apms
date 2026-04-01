import { doc, getDoc, getFirestore, onSnapshot, setDoc } from "@react-native-firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { LEGACY_USER_DOC } from "../services/userScope";

export const MIN_GEOFENCE_RADIUS = 50;
export const MAX_GEOFENCE_RADIUS = 1000;
export const DEFAULT_GEOFENCE_RADIUS = 200;

export type GeofenceSettings = {
  homeLatitude: number | null;
  homeLongitude: number | null;
  radius: number;
};

type HookState = {
  settings: GeofenceSettings;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
};

function clampRadius(value: number): number {
  return Math.max(MIN_GEOFENCE_RADIUS, Math.min(MAX_GEOFENCE_RADIUS, Math.round(value)));
}

function parseSettings(data: any): GeofenceSettings {
  const geofence = data?.geofence;

  const homeLatitude =
    typeof geofence?.homeLatitude === "number" && Number.isFinite(geofence.homeLatitude)
      ? geofence.homeLatitude
      : null;
  const homeLongitude =
    typeof geofence?.homeLongitude === "number" && Number.isFinite(geofence.homeLongitude)
      ? geofence.homeLongitude
      : null;
  const radius =
    typeof geofence?.radius === "number" && Number.isFinite(geofence.radius)
      ? clampRadius(geofence.radius)
      : DEFAULT_GEOFENCE_RADIUS;

  return {
    homeLatitude,
    homeLongitude,
    radius,
  };
}

export function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
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

export function useGeofenceSettings() {
  const { authUser } = useAuth();
  const [state, setState] = useState<HookState>({
    settings: {
      homeLatitude: null,
      homeLongitude: null,
      radius: DEFAULT_GEOFENCE_RADIUS,
    },
    loading: true,
    error: null,
    canEdit: false,
  });
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let active = true;

    async function subscribe() {
      if (!authUser) {
        setTargetUserId(null);
        setState((prev) => ({
          ...prev,
          loading: false,
          canEdit: false,
          error: null,
          settings: {
            homeLatitude: null,
            homeLongitude: null,
            radius: DEFAULT_GEOFENCE_RADIUS,
          },
        }));
        return;
      }

      const db = getFirestore();
      const primaryRef = doc(db, "users", authUser.uid);
      const primarySnapshot = await getDoc(primaryRef);
      const effectiveUserId =
        primarySnapshot.exists() || authUser.uid === LEGACY_USER_DOC ? authUser.uid : LEGACY_USER_DOC;
      const targetRef = doc(db, "users", effectiveUserId);

      if (!active) return;

      setTargetUserId(effectiveUserId);
      const canEdit = effectiveUserId === authUser.uid;

      unsubscribe = onSnapshot(
        targetRef,
        (snap) => {
          if (!snap.exists()) {
            setState({
              settings: {
                homeLatitude: null,
                homeLongitude: null,
                radius: DEFAULT_GEOFENCE_RADIUS,
              },
              loading: false,
              error: null,
              canEdit,
            });
            return;
          }

          setState({
            settings: parseSettings(snap.data()),
            loading: false,
            error: null,
            canEdit,
          });
        },
        (err: any) => {
          console.error("useGeofenceSettings error:", err);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err?.message || "Failed to load geofence settings.",
            canEdit,
          }));
        }
      );
    }

    subscribe().catch((err) => {
      console.error("useGeofenceSettings error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to load geofence settings.",
        canEdit: false,
      }));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authUser]);

  const saveSettings = useCallback(
    async (update: Partial<GeofenceSettings>) => {
      if (!authUser || !targetUserId || targetUserId !== authUser.uid) {
        throw new Error("Geofence settings are read-only for this profile.");
      }

      const merged: GeofenceSettings = {
        ...state.settings,
        ...update,
        radius:
          typeof update.radius === "number"
            ? clampRadius(update.radius)
            : state.settings.radius,
      };

      await setDoc(
        doc(getFirestore(), "users", authUser.uid),
        {
          geofence: {
            homeLatitude: merged.homeLatitude,
            homeLongitude: merged.homeLongitude,
            radius: merged.radius,
          },
        },
        { merge: true }
      );
    },
    [authUser, state.settings, targetUserId]
  );

  return {
    settings: state.settings,
    loading: state.loading,
    error: state.error,
    canEdit: state.canEdit,
    saveSettings,
  };
}
