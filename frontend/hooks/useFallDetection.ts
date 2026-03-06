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

export type FallEvent = {
  id: string;
  timestamp: number; // unix ms
  formattedTime: string; // e.g. "10:35 AM"
};

/**
 * Subscribes to the most recent doc in the `falls` collection.
 * The MPU-6050 should write a doc with a `timestamp` (Firestore Timestamp)
 * field whenever a fall is detected.
 *
 * falls doc shape: { timestamp: Timestamp }
 */
export function useFallDetection() {
  const [latestFall, setLatestFall] = useState<FallEvent | null>(null);

  useEffect(() => {
    const q = query(
      collection(getFirestore(), "falls"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setLatestFall(null);
          return;
        }
        const doc = snap.docs[0];
        const data = doc.data();
        const ts = data.timestamp as Timestamp;
        const date = ts.toDate();
        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        setLatestFall({ id: doc.id, timestamp: ts.toMillis(), formattedTime });
      },
      (err) => console.error("useFallDetection error:", err)
    );

    return unsub;
  }, []);

  return latestFall;
}
