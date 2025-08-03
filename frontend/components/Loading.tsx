import { ActivityIndicator, ColorValue, SafeAreaView } from "react-native";

type LoadingScreenProps = {
  color?: ColorValue;
};

export default function LoadingScreen({
  color = "#66cdaa",
}: LoadingScreenProps) {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ActivityIndicator testID="loading-spinner" size="large" color={color} />
    </SafeAreaView>
  );
}
