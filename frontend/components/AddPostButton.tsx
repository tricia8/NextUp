import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";

type AddPostButtonProps = {
  isVisible: boolean;
  setIsPostFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isDark?: boolean;
};

export default function AddPostButton({
  isVisible,
  setIsPostFormVisible,
  isDark = false,
}: AddPostButtonProps) {
  const styles = getStyles(isDark);
  return (
    isVisible && (
      <TouchableOpacity
        style={styles.postButton}
        onPress={() => setIsPostFormVisible(true)}
      >
        <ThemedText>Add post</ThemedText>
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={isDark ? "white" : "black"}
        />
      </TouchableOpacity>
    )
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    postButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 10,
      backgroundColor: isDark ? "#64748c" : "rgba(216, 210, 213, 0.59)",
      elevation: 2,
      borderRadius: 12,
      borderWidth: 0,
      borderColor: "transparent",
    },
  });
