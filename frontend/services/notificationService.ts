import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { type Medicine, type DayKey } from "../hooks/useMedicines";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

function getDayOfWeek(date: Date): DayKey {
  const days: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()] as DayKey;
}

function convertTo24Hour(hour: string, ampm: "AM" | "PM"): number {
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
}

function isDateInRange(date: Date, startDate: string, endDate: string): boolean {
  const d = date.toISOString().split("T")[0];
  return d >= startDate && d <= endDate;
}

function getNextReminderTime(medicine: Medicine): Date | null {
  const now = new Date();
  const medicineHour = convertTo24Hour(medicine.hour, medicine.ampm);
  const medicineMinute = parseInt(medicine.minute, 10);

  // Check duration if range-based
  if (medicine.durationType === "range") {
    if (!isDateInRange(now, medicine.startDate, medicine.endDate)) {
      // Try tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (!isDateInRange(tomorrow, medicine.startDate, medicine.endDate)) {
        return null;
      }
    }
  }

  // Find the next occurrence
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + daysAhead);

    const dayOfWeek = getDayOfWeek(checkDate);

    if (!medicine.days.includes(dayOfWeek)) {
      continue;
    }

    // Check duration again
    if (medicine.durationType === "range") {
      if (!isDateInRange(checkDate, medicine.startDate, medicine.endDate)) {
        continue;
      }
    }

    // Set the time
    checkDate.setHours(medicineHour, medicineMinute, 0, 0);

    // If this is today, only keep if time hasn't passed
    if (daysAhead === 0 && checkDate <= now) {
      continue;
    }

    return checkDate;
  }

  return null;
}

export async function scheduleMedicineNotifications(
  medicines: Medicine[]
): Promise<void> {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const medicine of medicines) {
      if (!medicine.enabled) continue;

      const nextReminder = getNextReminderTime(medicine);
      if (!nextReminder) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medicine Reminder",
          body: `Time to take ${medicine.name}${
            medicine.dose !== "—" ? ` - ${medicine.dose}` : ""
          }`,
          data: { medicineId: medicine.id },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextReminder,
        } as any,
      });

      console.log(
        `Scheduled notification for ${medicine.name} at ${nextReminder.toLocaleTimeString()}`
      );
    }
  } catch (error) {
    console.error("Error scheduling medicine notifications:", error);
  }
}

// Set up notification response handler
export function setupNotificationResponseHandler(
  callback?: (medicineId: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const medicineId = response.notification.request.content.data
        ?.medicineId as string | undefined;
      if (medicineId && callback) {
        callback(medicineId);
      }
    }
  );

  return () => subscription.remove();
}

// Set up notification listener for foreground
export function setupForegroundNotificationHandler(): () => void {
  const subscription = Notifications.addNotificationReceivedListener(() => {
    // Handle foreground notifications
  });

  return () => subscription.remove();
}

// Send immediate vital alert notification
export async function sendVitalAlert(
  title: string,
  body: string,
  vitalType: "heartRate" | "spo2"
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { vitalType },
        sound: "default",
      },
      trigger: null, // Send immediately
    });
    console.log(`Sent vital alert: ${title}`);
  } catch (error) {
    console.error("Error sending vital alert:", error);
  }
}

export async function sendGeofenceAlert(
  title: string,
  body: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { alertType: "geofence" },
        sound: "default",
      },
      trigger: null,
    });
    console.log(`Sent geofence alert: ${title}`);
  } catch (error) {
    console.error("Error sending geofence alert:", error);
  }
}
