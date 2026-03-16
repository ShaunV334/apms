import { useEffect, useRef } from "react";
import { sendVitalAlert } from "../services/notificationService";
import { useLatestVitals } from "./useVitals";

// Normal vital ranges
const NORMAL_HEART_RATE_MIN = 60;
const NORMAL_HEART_RATE_MAX = 100;
const NORMAL_SPO2_MIN = 95;
const NORMAL_SPO2_MAX = 100;

// Alert cooldown (ms) - prevent duplicate alerts within this time
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

interface AlertState {
  lastHeartRateAlert?: number;
  lastSpo2Alert?: number;
}

/**
 * Monitors vital readings and sends alerts when heart rate or SpO2 go out of normal ranges
 */
export function useVitalAlerts(): void {
  const { currentHeartRate, currentSpo2 } = useLatestVitals(1);
  const alertStateRef = useRef<AlertState>({
    lastHeartRateAlert: undefined,
    lastSpo2Alert: undefined,
  });

  useEffect(() => {
    const now = Date.now();
    const alertState = alertStateRef.current;

    // Check heart rate
    if (currentHeartRate !== null) {
      const isAbnormal = currentHeartRate < NORMAL_HEART_RATE_MIN || currentHeartRate > NORMAL_HEART_RATE_MAX;
      const canAlert = !alertState.lastHeartRateAlert || now - alertState.lastHeartRateAlert >= ALERT_COOLDOWN;

      if (isAbnormal && canAlert) {
        let title: string;
        let body: string;

        if (currentHeartRate < NORMAL_HEART_RATE_MIN) {
          title = "⚠️ Low Heart Rate";
          body = `Heart rate is ${currentHeartRate} bpm (normal: ${NORMAL_HEART_RATE_MIN}-${NORMAL_HEART_RATE_MAX})`;
        } else {
          title = "⚠️ High Heart Rate";
          body = `Heart rate is ${currentHeartRate} bpm (normal: ${NORMAL_HEART_RATE_MIN}-${NORMAL_HEART_RATE_MAX})`;
        }

        sendVitalAlert(title, body, "heartRate");
        alertState.lastHeartRateAlert = now;
      }
    }

    // Check SpO2
    if (currentSpo2 !== null) {
      const isAbnormal = currentSpo2 < NORMAL_SPO2_MIN || currentSpo2 > NORMAL_SPO2_MAX;
      const canAlert = !alertState.lastSpo2Alert || now - alertState.lastSpo2Alert >= ALERT_COOLDOWN;

      if (isAbnormal && canAlert) {
        let title: string;
        let body: string;

        if (currentSpo2 < NORMAL_SPO2_MIN) {
          title = "⚠️ Low Blood Oxygen";
          body = `SpO2 is ${currentSpo2}% (normal: ${NORMAL_SPO2_MIN}%-${NORMAL_SPO2_MAX}%)`;
        } else {
          title = "⚠️ High Blood Oxygen";
          body = `SpO2 is ${currentSpo2}% (normal: ${NORMAL_SPO2_MIN}%-${NORMAL_SPO2_MAX}%)`;
        }

        sendVitalAlert(title, body, "spo2");
        alertState.lastSpo2Alert = now;
      }
    }
  }, [currentHeartRate, currentSpo2]);
}
