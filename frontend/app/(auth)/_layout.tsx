import {
  Stack,
  Redirect,
  useRootNavigationState,
  useRouter,
  useNavigation,
} from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import useIsNavigationReady from "@/hooks/useIsNavigationReady";

export default function AuthLayout() {
  // const rootNavigationState = useRootNavigationState();
  const navigation = useNavigation();
  const navigationState = navigation.getState();
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    if (user) {
      if (!user.emailVerified) {
        console.log("User not verified, redirecting to login");
        router.replace("/(auth)/login");
      } else {
        console.log("User verified, redirecting to main");
        router.replace("/(main)/(tabs)");
      }
    }
  }, [user, loading /* rootNavigationState*/]);

  /* if (!rootNavigationState?.key) {
    console.log("Waiting for navigation state...");
    return null; // Wait for navigation to be ready
  } */
  if (loading) {
    console.log("Waiting for auth check...");
    return null; // Wait for auth check
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
