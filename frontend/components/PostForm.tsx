import {
  StatusBar,
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
import { pickMultipleImages } from "@/cloudinary/pickimage";
import ImageViewer from "./ImageViewer";
import { debouncePress } from "@/utils/debouncePress";
import { showMessage } from "react-native-flash-message";
import { uploadPostImageToCloudinary } from "@/cloudinary/upload";
import { PostImage } from "@/types/postImage";

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
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [base64, setBase64] = useState<string[] | null>(null); // set after picking images

  const { addPostToGoal, replacePostId, removePostFromGoal } =
    useSublistStore();

  const handlePickImages = async () => {
    const base64Data = await pickMultipleImages(setImages);
    if (base64Data) {
      setBase64(base64Data);
    }
  };

  // Save image URLs to cloudinary and return an array of {publicId: ..., secureUrl: ...} objects
  const saveImageUrls = async () => {
    console.log("base64: ", base64);
    if (images.length > 0 && base64) {
      try {
        const cloudinaryImages = await Promise.all(
          images.map(async (_image, index) => {
            return await uploadPostImageToCloudinary(
              base64[index],
              user?.uid,
              "posts"
            );
          })
        );
        console.log("All image objects:", cloudinaryImages);
        return cloudinaryImages;
      } catch (error) {
        console.error("Error uploading image:", error);
        return [];
      }
    } else {
      return [];
    }
  };

  const onPost = async () => {
    console.log("onPost called");
    setIsVisible(false);
    const tempId = "temp-" + Date.now();
    const formattedDate = formatPostDate(new Date()); // get local time

    try {
      console.log("Before saveImageUrls");
      addPostToGoal(goalId, {
        id: tempId,
        userId: user?.uid,
        username: user?.username,
        profilePhotoUrl: user?.photoUrl ?? "",
        comment: "Sending...",
        createdAt: formattedDate,
        updatedAt: formattedDate,
        images: [],
        isPending: true,
      });
      const images: PostImage[] = await saveImageUrls();

      console.log("Posting with images:", images);

      // Replace tempId when backend responds
      const { postData } = await addPost(sublistId, goalId, {
        username: user.username,
        profilePhotoUrl: user.photoUrl,
        comment,
        images,
      });
      replacePostId(goalId, tempId, { isPending: false, ...postData });
      setComment("");
      setImages([]);
    } catch (error) {
      console.error("Error adding post:", error);
      removePostFromGoal(goalId, tempId);
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add post",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        autoHide: false,
      });
    }
  };

  const onCancel = () => {
    setIsVisible(false);
    setComment("");
    setImages([]);
    setBase64(null);
  };

  return (
    isVisible && (
      <View style={styles.formView}>
        {images.length > 0 ? (
          <View style={{ height: 150, marginBottom: 10, width: "100%" }}>
            <ImageViewer
              setSelectedImages={setImages}
              selectedImages={images}
              setBase64={setBase64}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.postButton}
            onPress={debouncePress(handlePickImages)}
          >
            <ThemedText>Add Photos</ThemedText>
            <MaterialIcons
              name="perm-media"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        )}
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
