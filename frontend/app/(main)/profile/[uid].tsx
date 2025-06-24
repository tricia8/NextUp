import ProfileScreen from "@/components/ProfileScreen";
import { useLocalSearchParams } from "expo-router";

export default function OtherProfile() {
  const { uid } = useLocalSearchParams();

  return <ProfileScreen uid={uid as string} />;
}
