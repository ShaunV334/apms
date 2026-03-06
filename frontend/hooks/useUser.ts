import {
    doc,
    getFirestore,
    onSnapshot,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

export type UserProfile = {
  carerName: string;
  patientName: string;
  patientStatus: string;
};

// TODO: replace "default" with the authenticated user's UID once auth is wired up.
const USER_DOC = "default";

export function useUser(): UserProfile | null {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(getFirestore(), "users", USER_DOC),
      (snap) => {
        if (snap.exists) setUser(snap.data() as UserProfile);
      },
      (err) => console.error("useUser error:", err)
    );
    return unsub;
  }, []);

  return user;
}
