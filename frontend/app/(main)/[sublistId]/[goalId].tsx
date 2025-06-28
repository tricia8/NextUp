import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function GoalPage() {
  return (
    <SafeAreaView>
      <ThemedView></ThemedView>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  safeView: {
    flex: 1,
  },
  themedView: {
    flex: 1,
    padding: 20,
  },
});
