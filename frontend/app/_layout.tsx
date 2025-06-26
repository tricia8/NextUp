import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthContext";

import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FlashMessage from "react-native-flash-message";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider></SafeAreaProvider>
        <FlashMessage position="top" />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
