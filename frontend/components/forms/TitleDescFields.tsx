import { View } from "react-native";
import SublistField from "../SublistField";

interface TitleDescProps {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  lightLabelBg?: string;
  darkLabelBg?: string;
}

export default function TitleDescFields({
  title,
  description,
  setTitle,
  setDescription,
  lightLabelBg = "#a2e6ff",
  darkLabelBg = "#141515",
}: TitleDescProps) {
  return (
    <View style={{ gap: 10 }}>
      <SublistField
        label="Title"
        onChangeText={(value) => setTitle(value)}
        value={title}
        lightLabelBg={lightLabelBg}
        darkLabelBg={darkLabelBg}
      />
      <SublistField
        label="Description"
        onChangeText={(value) => setDescription(value)}
        value={description}
        multiline={true}
        placeholder="Add details, timelines, or motivations..."
        lightLabelBg={lightLabelBg}
        darkLabelBg={darkLabelBg}
      />
    </View>
  );
}
