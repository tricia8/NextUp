import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TouchableOpacity, View } from "react-native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import FlashMessage from "react-native-flash-message";
import { ThemedText } from "@/components/ThemedText";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });
  const router = useRouter();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen
              name="(auth)/signup"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/forgot-password"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(main)/(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(main)/new-sublist"
              options={{ title: "New Sublist" }}
            />
            <Stack.Screen
              name="(main)/current-sublist"
              options={{
                headerTitle: "",
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => router.push("/(main)/(tabs)/bucketlist")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="black" />

                    <View>
                      <ThemedText>back to Bucket List</ThemedText>
                    </View>
                  </TouchableOpacity>
                ),
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
      <FlashMessage position="top" />
    </AuthProvider>
  );
}
