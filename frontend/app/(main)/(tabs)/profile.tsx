import ProfileScreen from '@/components/ProfileScreen';
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

export default function ProfileIndex() {
  const { user } = useContext(AuthContext);

  return <ProfileScreen uid={user?.uid} />;
}