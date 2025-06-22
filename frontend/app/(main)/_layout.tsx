import { useContext } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { Redirect } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { RFValue } from "react-native-responsive-fontsize";
import { TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/ThemedText";

export default function MainLayout() {
  const { user, loading } = useContext(AuthContext);

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
          name="[sublistId]"
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
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={colorScheme == "dark" ? "white" : "black"}
                />

                <View>
                  <ThemedText>Back to Bucket List</ThemedText>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
