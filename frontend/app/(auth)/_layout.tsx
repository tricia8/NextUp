import { Stack, Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // Wait for auth check

  // 👇 Prevent logged-in users from accessing auth pages
  if (user) {
    return <Redirect href="/(main)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
