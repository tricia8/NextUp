import { Chip } from "react-native-paper";
import { Text } from "react-native";

type FilterChipProps = {
  onPress: () => void;
  selected: boolean;
  label: string;
};

export default function FilterChip({
  onPress,
  selected,
  label,
}: FilterChipProps) {
  return (
    <Chip
      selectedColor="#846dbeff"
      onPress={onPress}
      selected={selected}
      showSelectedOverlay={true}
    >
      <Text style={{ color: "#2b2e38" }}>{label}</Text>
    </Chip>
  );
}
