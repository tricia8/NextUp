import JourneyScreen from "@/components/JourneyScreen";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

export default function JourneyIndex() {
  const { user } = useContext(AuthContext);

  return <JourneyScreen />;
}
