import {
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { resolvedUserId } from "../services/userScope";

export type WatchLocationReading = {
  id: string;
  latitude: number;
  longitude: number;
  hdop: number | null;
  satellites: number | null;
  timestamp: number | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function useLatestWatchLocation() {
  const { authUser } = useAuth();
  const [location, setLocation] = useState<WatchLocationReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseLatestDoc = (d: any) => {
      const data = d.data();

      const lat = asNumber(data.latitude);
      const lng = asNumber(data.longitude);
      const hdop = asNumber(data.hdop);
      const satellites = asNumber(data.satellites);

      const rawTs = data.timestamp as Timestamp | number | null | undefined;
      const ts =
        typeof rawTs === "number"
          ? rawTs
          : rawTs instanceof Timestamp
            ? rawTs.toMillis()
            : null;

      if (lat === null || lng === null) {
        setLocation(null);
        setError("Latest GPS document is missing latitude/longitude.");
        setLoading(false);
        return;
      }

      setLocation({
        id: d.id,
        latitude: lat,
        longitude: lng,
        hdop,
        satellites,
        timestamp: ts,
      });
      setError(null);
      setLoading(false);
    };

    const topLevelQuery = query(
      collection(getFirestore(), "locations"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    let fallbackUnsub: (() => void) | null = null;

    const topLevelUnsub = onSnapshot(
      topLevelQuery,
      (snap) => {
        if (snap.empty) {
          setLocation(null);
          setLoading(false);
          setError(null);
          return;
        }

        parseLatestDoc(snap.docs[0]);
      },
      (err: any) => {
        const code = String(err?.code || "");
        if (!code.includes("permission-denied")) {
          console.error("useLatestWatchLocation error:", err);
          setError(err.message || "Failed to subscribe to watch location.");
          setLoading(false);
          return;
        }

        const scopedUserId = resolvedUserId(authUser?.uid);
        const userScopedQuery = query(
          collection(doc(getFirestore(), "users", scopedUserId), "locations"),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        fallbackUnsub = onSnapshot(
          userScopedQuery,
          (snap) => {
            if (snap.empty) {
              setLocation(null);
              setLoading(false);
              setError(
                `No watch location found. Ensure GPS uploads to users/${scopedUserId}/locations or allow reads on locations.`
              );
              return;
            }

            parseLatestDoc(snap.docs[0]);
          },
          (fallbackErr: any) => {
            console.error("useLatestWatchLocation error:", fallbackErr);
            setError(
              `Watch location access denied. Update Firestore rules for locations or users/${scopedUserId}/locations.`
            );
            setLoading(false);
          }
        );
      }
    );

    return () => {
      topLevelUnsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [authUser]);

  return { location, loading, error };
}
