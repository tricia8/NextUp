import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthContext";
import FlashMessage from "react-native-flash-message";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
      <FlashMessage position="top" />
    </AuthProvider>
  );
}
