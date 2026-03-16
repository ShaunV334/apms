import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

export type MedicineLog = {
  name: string;
  dose: string;
  status: "taken" | "missed" | "pending";
  scheduledTime: string;
  takenTime: string | null;
};

export type DayLog = {
  date: string; // YYYY-MM-DD
  label: string;
  medicines: MedicineLog[];
  avgHeartRate: number;
  avgHeartRateMin: number;
  avgHeartRateMax: number;
  avgSpo2: number;
  avgSpo2Min: number;
  avgSpo2Max: number;
};

function dateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type VitalDoc = {
  heartRate: number;
  spo2: number;
  timestamp: Timestamp | number;
};

type MedicineLogDoc = {
  medicineId: string;
  medicineName: string;
  dose: string;
  scheduledTime: string;
  date: string;
  status: "taken" | "missed" | "pending";
  takenTime: string | null;
};

export function useLogs(days = 30) {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const sinceTs = Timestamp.fromDate(since);
    const sinceDateStr = since.toISOString().split("T")[0];

    let vitalsData: VitalDoc[] = [];
    let medicineLogsData: MedicineLogDoc[] = [];
    let vitalsLoaded = false;
    let medicineLogsLoaded = false;

    function buildLogs() {
      if (!vitalsLoaded || !medicineLogsLoaded) return;

      const vitalsByDate: Record<string, { heartRates: number[]; spo2s: number[] }> = {};
      for (const v of vitalsData) {
        const ts =
          typeof v.timestamp === "number"
            ? v.timestamp
            : (v.timestamp as Timestamp).toMillis();
        const dateStr = new Date(ts).toISOString().split("T")[0];
        if (!vitalsByDate[dateStr]) vitalsByDate[dateStr] = { heartRates: [], spo2s: [] };
        vitalsByDate[dateStr].heartRates.push(v.heartRate);
        vitalsByDate[dateStr].spo2s.push(v.spo2);
      }

      const medsByDate: Record<string, MedicineLog[]> = {};
      for (const m of medicineLogsData) {
        if (!medsByDate[m.date]) medsByDate[m.date] = [];
        medsByDate[m.date].push({
          name: m.medicineName,
          dose: m.dose,
          status: m.status,
          scheduledTime: m.scheduledTime,
          takenTime: m.takenTime ?? null,
        });
      }

      const allDates = Array.from(
        new Set([...Object.keys(vitalsByDate), ...Object.keys(medsByDate)])
      ).sort((a, b) => b.localeCompare(a));

      const result: DayLog[] = allDates.map((date) => {
        const vitals = vitalsByDate[date];
        const medicines = medsByDate[date] ?? [];

        let avgHeartRate = 0, avgHeartRateMin = 0, avgHeartRateMax = 0;
        let avgSpo2 = 0, avgSpo2Min = 0, avgSpo2Max = 0;

        if (vitals && vitals.heartRates.length > 0) {
          const hrs = vitals.heartRates;
          avgHeartRate = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
          avgHeartRateMin = Math.min(...hrs);
          avgHeartRateMax = Math.max(...hrs);
        }

        if (vitals && vitals.spo2s.length > 0) {
          const sp = vitals.spo2s;
          avgSpo2 = Math.round(sp.reduce((a, b) => a + b, 0) / sp.length);
          avgSpo2Min = Math.min(...sp);
          avgSpo2Max = Math.max(...sp);
        }

        return {
          date,
          label: dateLabel(date),
          medicines,
          avgHeartRate,
          avgHeartRateMin,
          avgHeartRateMax,
          avgSpo2,
          avgSpo2Min,
          avgSpo2Max,
        };
      });

      setLogs(result);
      setLoading(false);
    }

    const unsubVitals = onSnapshot(
      query(
        collection(getFirestore(), "vitals"),
        where("timestamp", ">=", sinceTs),
        orderBy("timestamp", "desc")
      ),
      (snap) => {
        vitalsData = snap.docs.map((d: { data(): unknown }) => d.data() as VitalDoc);
        vitalsLoaded = true;
        buildLogs();
      },
      (err) => {
        console.error("useLogs vitals error:", err);
        vitalsLoaded = true;
        buildLogs();
      }
    );

    const unsubMeds = onSnapshot(
      query(
        collection(getFirestore(), "medicineLogs"),
        where("date", ">=", sinceDateStr),
        orderBy("date", "desc")
      ),
      (snap) => {
        medicineLogsData = snap.docs.map((d: { data(): unknown }) => d.data() as MedicineLogDoc);
        medicineLogsLoaded = true;
        buildLogs();
      },
      (err) => {
        console.error("useLogs medicineLogs error:", err);
        medicineLogsLoaded = true;
        buildLogs();
      }
    );

    return () => {
      unsubVitals();
      unsubMeds();
    };
  }, [days]);

  return { logs, loading };
}
