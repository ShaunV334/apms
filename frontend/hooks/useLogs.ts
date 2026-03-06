import {
    collection,
    documentId,
    getDocs,
    getFirestore,
    onSnapshot,
    query,
    Timestamp,
    where,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

export type MedicineLog = {
  name: string;
  dose: string;
  scheduledTime: string;
  takenTime: string | null;
  status: "taken" | "missed" | "pending";
};

export type DayLog = {
  date: string; // "YYYY-MM-DD"
  label: string;
  avgHeartRate: number;
  avgHeartRateMin: number;
  avgHeartRateMax: number;
  avgSpo2: number;
  avgSpo2Min: number;
  avgSpo2Max: number;
  medicines: MedicineLog[];
};

function buildLabel(dateStr: string): string {
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dMs = new Date(dateStr + "T00:00:00").setHours(0, 0, 0, 0);
  const diffDays = Math.round((todayMs - dMs) / 86_400_000);
  const fmt = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (diffDays === 0) return `Today — ${fmt}`;
  if (diffDays === 1) return `Yesterday — ${fmt}`;
  return fmt;
}

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

/**
 * Listens to `logs/{YYYY-MM-DD}` docs for the last `limitDays` days, then
 * fetches `vitals` for the same date range to compute per-day HR / SpO2 stats.
 *
 * logs doc shape:   { medicines: MedicineLog[] }
 * vitals doc shape: { heartRate: number, spo2: number, timestamp: Timestamp }
 */
export function useLogs(limitDays = 30) {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limitDays);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    // Filter by document ID (date string) without orderBy to avoid the
    // "FieldPath cannot be used with a different orderBy" Firestore restriction.
    // We sort the results client-side after the snapshot.
    const logsQuery = query(
      collection(getFirestore(), "logs"),
      where(documentId(), ">=", cutoffStr)
    );

    const unsubLogs = onSnapshot(
      logsQuery,
      async (logsSnap) => {
        if (!isMounted) return;

        if (logsSnap.empty) {
          setLogs([]);
          setLoading(false);
          return;
        }

        // Sort docs newest-first client-side
        const sortedDocs = [...logsSnap.docs].sort((a, b) =>
          b.id.localeCompare(a.id)
        );

        const dates = sortedDocs.map((d) => d.id);
        const minDate = [...dates].sort()[0];
        const maxDate = [...dates].sort().at(-1)!;

        const startTs = Timestamp.fromDate(new Date(minDate + "T00:00:00"));
        const endTs = Timestamp.fromDate(new Date(maxDate + "T23:59:59"));

        try {
          const vitalsSnap = await getDocs(
            query(
              collection(getFirestore(), "vitals"),
              where("timestamp", ">=", startTs),
              where("timestamp", "<=", endTs)
            )
          );

          if (!isMounted) return;

          // Group vitals by date string
          const byDate: Record<string, { hrs: number[]; sp: number[] }> = {};
          vitalsSnap.docs.forEach((d) => {
            const data = d.data();
            const dateKey = (data.timestamp as Timestamp)
              .toDate()
              .toISOString()
              .split("T")[0];
            if (!byDate[dateKey]) byDate[dateKey] = { hrs: [], sp: [] };
            byDate[dateKey].hrs.push(data.heartRate as number);
            byDate[dateKey].sp.push(data.spo2 as number);
          });

          const merged: DayLog[] = sortedDocs.map((d) => {
            const date = d.id;
            const data = d.data();
            const v = byDate[date];
            const hrs = v?.hrs ?? [];
            const sp = v?.sp ?? [];
            return {
              date,
              label: buildLabel(date),
              avgHeartRate: avg(hrs),
              avgHeartRateMin: hrs.length ? Math.min(...hrs) : 0,
              avgHeartRateMax: hrs.length ? Math.max(...hrs) : 0,
              avgSpo2: avg(sp),
              avgSpo2Min: sp.length ? Math.min(...sp) : 0,
              avgSpo2Max: sp.length ? Math.max(...sp) : 0,
              medicines: (data.medicines ?? []) as MedicineLog[],
            };
          });

          if (isMounted) setLogs(merged);
        } catch (err) {
          console.error("useLogs vitals fetch error:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      },
      (err) => {
        console.error("useLogs error:", err);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubLogs();
    };
  }, [limitDays]);

  return { logs, loading };
}
