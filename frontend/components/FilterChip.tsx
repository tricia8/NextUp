import { Chip } from "react-native-paper";
import { ThemedText } from "./ThemedText";

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
      <ThemedText>{label}</ThemedText>
    </Chip>
  );
}
