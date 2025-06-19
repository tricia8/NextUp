import { View } from "react-native";
import SublistField from "../SublistField";

interface TitleDescProps {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
}

export default function TitleDescFields({
  title,
  description,
  setTitle,
  setDescription,
}: TitleDescProps) {
  return (
    <View style={{ gap: 10 }}>
      <SublistField
        label="Title"
        onChangeText={(value) => setTitle(value)}
        value={title}
      />
      <SublistField
        label="Description"
        onChangeText={(value) => setDescription(value)}
        value={description}
        multiline={true}
        placeholder="Add details, timelines, or motivations..."
      />
    </View>
  );
}
