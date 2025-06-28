import { View } from "react-native";
import SublistField from "./SublistField";
import { ThemedText } from "../ThemedText";
import { RFValue } from "react-native-responsive-fontsize";

interface TitleDescProps {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  lightLabelBg?: string;
  darkLabelBg?: string;
  errors?: {
    title?: string;
    accessLevel?: string;
  };
  setErrors?: React.Dispatch<
    React.SetStateAction<{
      title?: string;
      accessLevel?: string;
    }>
  >;
}

export default function TitleDescFields({
  title,
  description,
  setTitle,
  setDescription,
  lightLabelBg = "#a2e6ff",
  darkLabelBg = "#141515",
  errors = {},
  setErrors = () => {},
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
      {errors.title && (
        <ThemedText
          style={{ fontSize: RFValue(12) }}
          lightColor="#c40028"
          darkColor="#ffb1c1"
        >
          {errors.title}
        </ThemedText>
      )}

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
