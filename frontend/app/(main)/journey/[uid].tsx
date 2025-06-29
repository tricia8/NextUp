import JourneyScreen from "@/components/JourneyScreen";
import { useLocalSearchParams } from "expo-router";

export default function OtherProfile() {
  const { uid } = useLocalSearchParams();

  return <JourneyScreen />;
}