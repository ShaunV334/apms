import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

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

// TODO: scope to authenticated user's UID once auth is wired up.
const medicinesCol = () => collection(getFirestore(), "medicines");

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(medicinesCol(), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
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
    return unsubscribe;
  }, []);

  async function addMedicine(
    form: Omit<Medicine, "id" | "enabled" | "color">
  ): Promise<void> {
    const color = ACCENT_COLORS[medicines.length % ACCENT_COLORS.length];
    await addDoc(medicinesCol(), {
      ...form,
      enabled: true,
      color,
      createdAt: serverTimestamp(),
    });
  }

  async function toggleMedicine(id: string, current: boolean): Promise<void> {
    await updateDoc(doc(getFirestore(), "medicines", id), { enabled: !current });
  }

  async function deleteMedicine(id: string): Promise<void> {
    await deleteDoc(doc(getFirestore(), "medicines", id));
  }

  return { medicines, loading, addMedicine, toggleMedicine, deleteMedicine };
}
