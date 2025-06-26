import { Stack, Redirect, useRootNavigationState } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useContext(AuthContext);
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null; // Wait for navigation to be ready
  if (loading) return null; // Wait for auth check

  // Prevent unverified users from accessing (main) pages
  if (user) {
    // Check if email is verified
    if (!user.emailVerified) {
      // redirect to a "verify your email" screen
      return <Redirect href="/(auth)/login" />;
    }
    return <Redirect href="/(main)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
