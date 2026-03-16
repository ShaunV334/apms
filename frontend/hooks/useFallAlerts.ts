import { useEffect, useRef } from "react";
import { sendVitalAlert } from "../services/notificationService";
import { useFallDetection } from "./useFallDetection";

interface FallAlertState {
  lastAlertedFallId?: string;
}

/**
 * Monitors fall detection and sends alerts when a fall is detected
 */
export function useFallAlerts(): void {
  const latestFall = useFallDetection();
  const alertStateRef = useRef<FallAlertState>({
    lastAlertedFallId: undefined,
  });

  useEffect(() => {
    if (!latestFall) return;

    const alertState = alertStateRef.current;

    // Only alert if it's a new fall (different ID from last alert)
    if (latestFall.id !== alertState.lastAlertedFallId) {
      sendVitalAlert(
        "🚨 FALL DETECTED!",
        `A fall was detected at ${latestFall.formattedTime}. Please check on the patient immediately.`,
        "heartRate" // Using heartRate as the type, but this is for fall detection
      );
      alertState.lastAlertedFallId = latestFall.id;
    }
  }, [latestFall]);
}
