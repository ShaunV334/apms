import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "@react-native-firebase/firestore";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  authUser: FirebaseAuthTypes.User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function defaultCarerName(email: string): string {
  const handle = email.split("@")[0]?.trim();
  return handle ? handle.replace(/[._-]+/g, " ") : "Carer";
}

async function ensureUserProfile(user: FirebaseAuthTypes.User): Promise<void> {
  const profileRef = doc(getFirestore(), "users", user.uid);
  const existing = await getDoc(profileRef);

  if (existing.exists()) {
    return;
  }

  await setDoc(profileRef, {
    carerName: defaultCarerName(user.email ?? "Carer"),
    patientName: "No patient assigned",
    patientStatus: "Setup needed",
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authUser, setAuthUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (nextUser) => {
      setAuthUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      initializing,
      async signIn(email: string, password: string) {
        await signInWithEmailAndPassword(getAuth(), email.trim(), password);
      },
      async signUp(email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
        await ensureUserProfile(credential.user);
      },
      async signOut() {
        await firebaseSignOut(getAuth());
      },
    }),
    [authUser, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}