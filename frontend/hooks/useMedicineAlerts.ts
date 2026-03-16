import { useEffect, useRef } from "react";
import type { Medicine, DayKey } from "./useMedicines";
import { sendVitalAlert } from "../services/notificationService";

interface MedicineAlertState {
  alertedMedicineIds: Set<string>;
}

const DAY_KEYS_ORDERED = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Monitors enabled medicines and sends alerts when a dose is due
 * based on the current time and the medicine's schedule
 */
export function useMedicineAlerts(medicines: Medicine[]): void {
  const alertStateRef = useRef<MedicineAlertState>({
    alertedMedicineIds: new Set(),
  });

  useEffect(() => {
    // Reset alerts at midnight to allow re-alerting for new day
    const updateAlerts = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Reset at midnight
      if (hour === 0 && minute === 0) {
        alertStateRef.current.alertedMedicineIds.clear();
      }
    };

    // Run immediately
    updateAlerts();

    // Check every minute
    const interval = setInterval(updateAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    const todayKey = DAY_KEYS_ORDERED[now.getDay()] as DayKey;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    function toMins(hour: string, minute: string, ampm: string): number {
      let h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    }

    const alertState = alertStateRef.current;

    for (const medicine of medicines) {
      if (!medicine.enabled) continue;

      // Check if medicine is scheduled for today
      if (!medicine.days.includes(todayKey)) continue;

      // Check if medicine is within date range (if applicable)
      if (medicine.durationType === "range") {
        const today = new Date().toISOString().split("T")[0];
        if (today < medicine.startDate || today > medicine.endDate) continue;
      }

      const medicineMins = toMins(medicine.hour, medicine.minute, medicine.ampm);

      // Alert if we're within 5 minutes before the medicine time
      // and we haven't alerted for this medicine yet today
      const timeDiff = medicineMins - currentMins;
      const shouldAlert = timeDiff >= -1 && timeDiff <= 5 && !alertState.alertedMedicineIds.has(medicine.id);

      if (shouldAlert) {
        sendVitalAlert(
          "💊 Medicine Reminder",
          `Time to take ${medicine.name}${
            medicine.dose !== "—" ? ` - ${medicine.dose}` : ""
          } at ${medicine.hour}:${medicine.minute} ${medicine.ampm}`,
          "heartRate" // Using heartRate as type, but this is for medicine
        );
        alertState.alertedMedicineIds.add(medicine.id);
      }
    }
  }, [medicines]);
}
