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
import { useSublistStore } from "@/stores/sublistStore";
import { User } from "@/types/user";
import { addPost, formatPostDate } from "@/firebase/firestore";
import { useShallow } from "zustand/react/shallow";

type PostFormProps = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  sublistId: string;
  goalId: string;
  user: User;
  lightLabelBg?: string;
  darkLabelBg?: string;
};

export default function PostForm({
  isVisible,
  setIsVisible,
  sublistId,
  goalId,
  user,
  lightLabelBg = "#a2e6ff",
  darkLabelBg = "#141515",
}: PostFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { addPostToGoal, replacePostId } = useSublistStore();
  const postOrder = useSublistStore(
    useShallow((state) => state.postOrderByGoal[goalId])
  );

  const onPost = async () => {
    setIsVisible(false);
    const tempId = "temp-" + Date.now();
    const formattedDate = formatPostDate(Date.now());

    addPostToGoal(goalId, {
      id: tempId,
      userId: user?.uid,
      username: user?.username,
      profilePhotoUrl: user?.photoUrl ?? "",
      comment: "Sending...",
      createdAt: formattedDate,
      updatedAt: formattedDate,
      imageUrl: imageUrl,
      isPending: true,
    });

    // Replace tempId when backend responds
    const { postData } = await addPost(sublistId, goalId, {
      username: user.username,
      profilePhotoUrl: user.photoUrl,
      comment,
      imageUrl,
    });
    replacePostId(goalId, tempId, { isPending: false, ...postData });
    setComment("");
    setImageUrl("");
  };

  const onCancel = () => {
    () => setIsVisible(false);
    setComment("");
    setImageUrl("");
  };

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
          onChangeText={(value) => setComment(value)}
          value={comment}
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
            onPress={onCancel}
          >
            <ThemedText>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postButton, { flex: 0.5 }]}
            onPress={onPost}
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
