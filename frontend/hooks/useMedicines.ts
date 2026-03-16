import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { userCollection } from "../services/userScope";

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type DurationType = "permanent" | "range";

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  hour: string;
  minute: string;
  ampm: "AM" | "PM";
  days: DayKey[];
  durationType: DurationType;
  startDate: string;
  endDate: string;
  enabled: boolean;
  color: string;
};

const ACCENT_COLORS = [
  "#1E88E5",
  "#4CAF50",
  "#FB8C00",
  "#9C27B0",
  "#E53935",
  "#00ACC1",
];

type MedicineSource = "user" | "legacy";

async function canReadCollection(pathQuery: ReturnType<typeof query>): Promise<boolean> {
  try {
    await getDocs(pathQuery);
    return true;
  } catch (error: any) {
    if (String(error?.code || "").includes("permission-denied")) {
      return false;
    }

    throw error;
  }
}

export function useMedicines() {
  const { authUser } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<MedicineSource>("user");

  function collectionFor(sourceType: MedicineSource) {
    if (!authUser || sourceType === "legacy") {
      return collection(getFirestore(), "medicines");
    }

    return userCollection(authUser.uid, "medicines");
  }

  useEffect(() => {
    let unsubscribe = () => undefined;
    let active = true;

    async function subscribe() {
      if (!authUser) {
        setMedicines([]);
        setLoading(false);
        setSource("user");
        return;
      }

      setLoading(true);

      const userCol = userCollection(authUser.uid, "medicines");
      const legacyCol = collection(getFirestore(), "medicines");
      const userProbe = query(userCol, limit(1));
      const legacyProbe = query(legacyCol, limit(1));
      const [canReadUser, canReadLegacy] = await Promise.all([
        canReadCollection(userProbe),
        canReadCollection(legacyProbe),
      ]);

      let nextSource: MedicineSource = "user";

      if (!canReadUser && canReadLegacy) {
        nextSource = "legacy";
      }

      if (canReadUser) {
        const userSnapshot = await getDocs(userProbe);
        if (userSnapshot.empty && canReadLegacy) {
          const legacySnapshot = await getDocs(legacyProbe);
          nextSource = legacySnapshot.empty ? "user" : "legacy";
        }
      }

      if (!canReadUser && !canReadLegacy) {
        setMedicines([]);
        setLoading(false);
        return;
      }

      if (!active) {
        return;
      }

      setSource(nextSource);

      unsubscribe = onSnapshot(
        query(collectionFor(nextSource), orderBy("createdAt", "asc")),
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({
            ...(d.data() as Omit<Medicine, "id">),
            id: d.id,
          }));
          setMedicines(docs);
          setLoading(false);
        },
        (error) => {
          console.error("useMedicines snapshot error:", error);
          setLoading(false);
        }
      );
    }

    subscribe().catch((error) => {
      console.error("useMedicines setup error:", error);
      setMedicines([]);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authUser]);

  async function addMedicine(
    form: Omit<Medicine, "id" | "enabled" | "color">
  ): Promise<void> {
    const color = ACCENT_COLORS[medicines.length % ACCENT_COLORS.length];

    if (!authUser && source === "user") {
      throw new Error("Must be signed in to add medicines.");
    }

    await addDoc(collectionFor(source), {
      ...form,
      enabled: true,
      color,
      createdAt: serverTimestamp(),
    });
  }

  async function toggleMedicine(id: string, current: boolean): Promise<void> {
    if (source === "legacy") {
      await updateDoc(doc(getFirestore(), "medicines", id), { enabled: !current });
      return;
    }

    if (!authUser) {
      throw new Error("Must be signed in to update medicines.");
    }

    await updateDoc(doc(userCollection(authUser.uid, "medicines"), id), { enabled: !current });
  }

  async function deleteMedicine(id: string): Promise<void> {
    if (source === "legacy") {
      await deleteDoc(doc(getFirestore(), "medicines", id));
      return;
    }

    if (!authUser) {
      throw new Error("Must be signed in to delete medicines.");
    }

    await deleteDoc(doc(userCollection(authUser.uid, "medicines"), id));
  }

  return { medicines, loading, addMedicine, toggleMedicine, deleteMedicine };
}
