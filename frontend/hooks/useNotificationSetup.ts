import { useEffect } from "react";
import type { Medicine } from "./useMedicines";

export function useNotificationSetup(medicines: Medicine[]): void {
  useEffect(() => {
    let isMounted = true;
    let unsubscribeResponse: (() => void) | null = null;
    let unsubscribeForeground: (() => void) | null = null;

    const initializeNotifications = async () => {
      try {
        // Dynamically import to avoid errors if native modules aren't compiled yet
        const {
          requestNotificationPermissions,
          scheduleMedicineNotifications,
          setupNotificationResponseHandler,
          setupForegroundNotificationHandler,
        } = await import("../services/notificationService");

        // Request permissions
        const permissionsGranted = await requestNotificationPermissions();

        if (!permissionsGranted) {
          console.warn("Notifications not enabled by user");
          return;
        }

        if (!isMounted) return;

        // Schedule notifications for all enabled medicines
        await scheduleMedicineNotifications(medicines);
        console.log("Scheduled medicine notifications");

        // Set up response handler
        unsubscribeResponse = setupNotificationResponseHandler((medicineId) => {
          console.log(`User interacted with notification for medicine: ${medicineId}`);
        });

        // Set up foreground handler
        unsubscribeForeground = setupForegroundNotificationHandler();
      } catch (error) {
        console.warn("Notifications not available (native modules may not be compiled):", error);
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
      if (unsubscribeResponse) unsubscribeResponse();
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [medicines]);
}
