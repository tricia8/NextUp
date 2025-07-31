import { Stack, useRouter } from "expo-router";
import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRootNavigationState, usePathname } from "expo-router";

export default function AuthLayout() {
  // const navigation = useNavigation();
  // const navigationState = navigation.getState();
  const rootNavigationState = useRootNavigationState();
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!rootNavigationState?.key || loading || hasRedirected.current) return;

    /* if (user) {
      if (!user.emailVerified) {
        if (pathname !== "/(auth)/login") {
          router.replace("/(auth)/login");
        }
      } else {
        if (pathname !== "/(main)/(tabs)") {
          router.replace("/(main)/(tabs)");
        }
      }
    } */

    // User is signed in but email not verified -> go to login
    if (user && !user.emailVerified && pathname !== "/(auth)/login") {
      hasRedirected.current = true;
      router.replace("/(auth)/login");
      return;
    } else if (user && user.emailVerified && pathname !== "/(main)/(tabs)") {
      // User is signed in and verified -> go to main tabs
      hasRedirected.current = true;
      router.replace("/(main)/(tabs)");
      return;
    } else if (!user && pathname !== "/(auth)/login") {
      // User is not signed in -> go to login
      hasRedirected.current = true;
      router.replace("/(auth)/login");
    }
  }, [user, loading, pathname, rootNavigationState?.key]);

  /* useEffect(() => {
    console.log("Auth Check", { user, emailVerified: user?.emailVerified });
  }, [user]); */

  if (!rootNavigationState?.key) {
    console.log("Waiting for navigation state...");
    return null; // Wait for navigation to be ready
  }
  if (loading) {
    console.log("Waiting for auth check...");
    return null; // Wait for auth check
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
