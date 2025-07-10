import { useContext } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { Redirect, useRootNavigationState } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import { RFValue } from "react-native-responsive-fontsize";

export default function MainLayout() {
  const { user, loading } = useContext(AuthContext);
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null; // Wait for navigation to be ready

  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // If user info is not ready
  if (loading) {
    // Can optionally show a loading indicator or splash screen
    return null;
  }

  // Handle unauthenticated access
  if (!user) return <Redirect href="/(auth)/login" />;

  const router = useRouter();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-sublist"
          options={{
            title: "New Sublist",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: RFValue(26),
            },
          }}
        />
        <Stack.Screen
          name="friends"
          options={{
            title: "Friends",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: RFValue(22),
            },
          }}
        />
        <Stack.Screen
          name="addfriends"
          options={{
            title: "Add friends",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: RFValue(22),
            },
          }}
        />
        <Stack.Screen name="profile/[uid]" options={{ headerShown: false }} />
        <Stack.Screen
          name="[sublistId]/index"
          options={{
            headerTitle: "",
          }}
        />
        <Stack.Screen
          name="[sublistId]/[goalId]"
          options={{ headerTitle: "" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
