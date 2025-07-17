import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import SublistField from "./forms/SublistField";
import { useState } from "react";

type PostFormProps = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  lightLabelBg?: string;
  darkLabelBg?: string;
};

export default function PostForm({
  isVisible,
  setIsVisible,
  lightLabelBg = "#a2e6ff",
  darkLabelBg = "#141515",
}: PostFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  const [description, setDescription] = useState("");

  return (
    isVisible && (
      <View style={styles.formView}>
        <TouchableOpacity
          style={styles.postButton}
          onPress={() => console.log("Add Media Pressed")}
        >
          <ThemedText>Add Media</ThemedText>
          <MaterialIcons name="perm-media" size={24} color="black" />
        </TouchableOpacity>
        <SublistField
          label="Description"
          onChangeText={(value) => setDescription(value)}
          value={description}
          multiline={true}
          placeholder="What's on your mind?"
          lightLabelBg={lightLabelBg}
          darkLabelBg={darkLabelBg}
          containerStyles={styles.descInput}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={[styles.postButton, styles.cancelButton, { flex: 0.5 }]}
            onPress={() => setIsVisible(false)}
          >
            <ThemedText>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postButton, { flex: 0.5 }]}
            onPress={() => {}}
          >
            <ThemedText>Post</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    )
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    formView: {
      gap: 13,
    },
    postButton: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      padding: 10,
      backgroundColor: isDark ? "#64748c" : "#cbe3df",
      elevation: 2,
      borderRadius: 12,
      borderWidth: 0,
      borderColor: "transparent",
    },
    cancelButton: {
      backgroundColor: isDark ? "#517e76" : "#94ceaf",
    },
    descInput: {
      borderColor: isDark ? "#64748c" : "black",
    },
  });
