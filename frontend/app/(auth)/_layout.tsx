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
    // Wait until navigation and auth are ready
    if (!rootNavigationState?.key || loading) return;

    // Reset redirect flag if user changes
    hasRedirected.current = false;
  }, [user, loading, rootNavigationState?.key]);

  useEffect(() => {
    if (!rootNavigationState?.key || loading || hasRedirected.current) return;

    if (user && user.emailVerified) {
      hasRedirected.current = true;
      router.replace("/(main)/(tabs)");
    } else {
      hasRedirected.current = true;
      router.replace("/(auth)/login");
    }
  }, [user, loading, pathname, rootNavigationState?.key]);

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
