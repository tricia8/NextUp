import { Stack, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRootNavigationState, usePathname } from "expo-router";

export default function AuthLayout() {
  // const navigation = useNavigation();
  // const navigationState = navigation.getState();
  const rootNavigationState = useRootNavigationState();
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!rootNavigationState?.key || loading) return;

    if (user) {
      if (!user.emailVerified) {
        if (pathname !== "/(auth)/login") {
          router.replace("/(auth)/login");
        }
      } else {
        if (pathname !== "/(main)/(tabs)") {
          router.replace("/(main)/(tabs)");
        }
      }
    }
  }, [user, loading, rootNavigationState]);

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
