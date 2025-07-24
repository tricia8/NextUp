import { useEffect } from "react";
import { useColorScheme } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

export default function useThemedUI() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set navigation bar background color
    NavigationBar.setStyle(colorScheme === "dark" ? "dark" : "light");
  }, [colorScheme]);
}
