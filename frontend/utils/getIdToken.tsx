import { getAuth } from "firebase/auth";

export async function getIdTokenFromFirebaseUser() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");
  return await user.getIdToken();
}