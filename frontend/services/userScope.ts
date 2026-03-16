import { collection, doc, getFirestore } from "@react-native-firebase/firestore";

export const LEGACY_USER_DOC = "default";

export function userDoc(uid: string) {
  return doc(getFirestore(), "users", uid);
}

export function userCollection(uid: string, collectionName: string) {
  return collection(userDoc(uid), collectionName);
}

export function resolvedUserId(uid?: string | null): string {
  return uid ?? LEGACY_USER_DOC;
}