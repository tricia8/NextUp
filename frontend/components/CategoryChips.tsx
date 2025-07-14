import { View } from "react-native";
import { Chip } from "react-native-paper";
import { RFValue } from "react-native-responsive-fontsize";

type CategoryChipsProps = {
  selectedTags: string[];
};

const categoryColorMap: Record<string, { bg: string; text: string }> = {
  Sports: { bg: "#e0f7fa", text: "#006064" },
  Travel: { bg: "#f1f8e9", text: "#33691e" },
  Food: { bg: "#fff3e0", text: "#e65100" },
  Music: { bg: "#fce4ec", text: "#880e4f" },
  Fitness: { bg: "#e8f5e9", text: "#1b5e20" },
  Games: { bg: "#ede7f6", text: "#4527a0" },
  Education: { bg: "#e3f2fd", text: "#0d47a1" },
  Social: { bg: "#f3e5f5", text: "#6a1b9a" },
  Volunteering: { bg: "#f9fbe7", text: "#827717" },
  Arts: { bg: "#fffde7", text: "#f57f17" },
  Tech: { bg: "#e1f5fe", text: "#01579b" },
  Others: { bg: "#eceff1", text: "#263238" },
  default: { bg: "#e0e0e0", text: "#424242" },
};

export default function CategoryChips({ selectedTags }: CategoryChipsProps) {
  return (
    selectedTags.length > 0 && (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {selectedTags.map((tag) => {
          const { bg, text } =
            categoryColorMap[tag] || categoryColorMap.default;
          return (
            <Chip
              key={tag}
              icon="tag"
              style={{
                borderRadius: 15,
                backgroundColor: bg,
              }}
              compact
              textStyle={{
                fontSize: RFValue(10),
                color: text,
              }}
            >
              {tag}
            </Chip>
          );
        })}
      </View>
    )
  );
}
