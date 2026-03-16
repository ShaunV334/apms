import {
    doc,
  getDoc,
    getFirestore,
    onSnapshot,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { LEGACY_USER_DOC } from "../services/userScope";

export type UserProfile = {
  carerName: string;
  patientName: string;
  patientStatus: string;
  patients?: PatientProfile[];
};

export type PatientProfile = {
  id: string;
  name: string;
  status: string;
};

export function useUser(): UserProfile | null {
  const { authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let unsubscribe = () => undefined;
    let active = true;

    async function subscribe() {
      if (!authUser) {
        setUser(null);
        return;
      }

      const primaryRef = doc(getFirestore(), "users", authUser.uid);
      const primarySnapshot = await getDoc(primaryRef);
      const targetRef =
        primarySnapshot.exists() || authUser.uid === LEGACY_USER_DOC
          ? primaryRef
          : doc(getFirestore(), "users", LEGACY_USER_DOC);

      if (!active) {
        return;
      }

      unsubscribe = onSnapshot(
        targetRef,
        (snap) => {
          if (snap.exists) {
            setUser(snap.data() as UserProfile);
            return;
          }

          setUser(null);
        },
        (err) => console.error("useUser error:", err)
      );
    }

    subscribe().catch((err) => {
      console.error("useUser error:", err);
      setUser(null);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authUser]);

  return user;
}
