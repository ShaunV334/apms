import {
    collection,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

export type VitalReading = {
  id: string;
  heartRate: number;
  spo2: number;
  timestamp: number; // unix ms
};

/**
 * Subscribes to the latest `n` vitals readings, ordered oldest→newest
 * so they can be passed directly to a chart.
 *
 * Firestore doc shape: { heartRate: number, spo2: number, timestamp: Timestamp }
 */
export function useLatestVitals(n = 10) {
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(getFirestore(), "vitals"),
      orderBy("timestamp", "desc"),
      limit(n)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: VitalReading[] = snap.docs.map((d) => {
          const data = d.data();
          const ts = data.timestamp as Timestamp | number;
          return {
            id: d.id,
            heartRate: data.heartRate as number,
            spo2: data.spo2 as number,
            timestamp:
              typeof ts === "number" ? ts : (ts as Timestamp).toMillis(),
          };
        });
        // Reverse so oldest is first (left → right on chart)
        setReadings(docs.reverse());
        setLoading(false);
      },
      (err) => {
        console.error("useLatestVitals error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [n]);

  const latest = readings[readings.length - 1];

  return {
    readings,
    loading,
    currentHeartRate: latest?.heartRate ?? null,
    currentSpo2: latest?.spo2 ?? null,
  };
}
