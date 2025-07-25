import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity, Text, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { ms } from "react-native-size-matters";

type Props = {
  label: string;
  value: string;
  onPress: (value: string) => void;
};

export default function InviteeBadge({ label, value, onPress }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e0e0e0",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        margin: 2,
      }}
    >
      <Text style={{ fontSize: RFValue(12), marginRight: 4 }}>{label}</Text>
      <TouchableOpacity onPress={() => onPress(value)}>
        <Ionicons name="close-circle" size={ms(15)} color="#900" />
      </TouchableOpacity>
    </View>
  );
}
