import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";

type AddPostButtonProps = {
  isVisible: boolean;
  setIsPostFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isDark?: boolean;
  onPress?: () => void;
};

export default function AddPostButton({
  isVisible,
  setIsPostFormVisible,
  isDark = false,
  onPress = () => {},
}: AddPostButtonProps) {
  const styles = getStyles(isDark);
  return (
    isVisible && (
      <TouchableOpacity
        style={styles.postButton}
        onPress={() => {
          setIsPostFormVisible(true);
          onPress();
        }}
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
      backgroundColor: isDark ? "#64748c" : "#cbe3df", // "#e2e8f0",
      elevation: 2,
      borderRadius: 12,
      borderWidth: 0,
      borderColor: "transparent",
    },
  });
