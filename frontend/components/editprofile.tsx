import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import { User } from "@/types/user";
import { getUserProfile, updateProfile } from "@/firebase/firestore";
import CategoryPicker from "./forms/CategoryPicker";
import { pickImage } from "@/cloudinary/pickimage";
import { uploadToCloudinary } from "@/cloudinary/upload";
import { debouncePress } from "@/utils/debouncePress";
import ProfilePic from "./ProfilePic";
import { useUserStore } from "@/stores/userStore";

const PROFILEPICSIZE = ms(100);

type editProfileProps = {
  visible: boolean;
  onClose: () => void;
  userData: User;
  setUserData: (user: User | null) => void;
  setCategory: (category: string) => void;
};

export default function EditProfile({
  visible,
  onClose,
  userData,
  setUserData,
  setCategory,
}: editProfileProps) {
  const [bioText, setBioText] = useState(userData.bio ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const styles = makeStyles(colorScheme);

  useEffect(() => {
    if (userData.photoUrl) {
      setImage(userData.photoUrl);
    }
  }, [userData]);

  const { setUser } = useUserStore();
  const handleSave = async (uid: string, profileDetails: Partial<User>) => {
    try {
      if (base64) {
        const imageUrl = await uploadToCloudinary(base64, uid, "profile_pic");
        console.log(imageUrl);
        profileDetails.photoUrl = imageUrl; // attach before saving
      }
      await updateProfile(uid, profileDetails);
      Alert.alert("Saved!");
      const updatedUser = await getUserProfile(uid); // refetch
      onClose();
      setUserData(updatedUser);
      setCategory(updatedUser?.category?.[0] ?? "--");
      setUser(updatedUser);
    } catch (error) {
      console.log(error);
      Alert.alert("Error saving");
    }
  };

  const handlePickImage = async () => {
    const base64Data = await pickImage(setImage);
    if (base64Data) {
      setBase64(base64Data);
    }
  };

  const handleClose = async () => {
    onClose();
    setImage(userData.photoUrl);
  };

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.4}
      onBackdropPress={handleClose}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
    >
      <View style={{ justifyContent: "center" }}>
        <ThemedView style={styles.mainContainer}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={debouncePress(handlePickImage)}>
              <ProfilePic imageUrl={image} size={PROFILEPICSIZE} />
            </TouchableOpacity>

            <ThemedText type="defaultSemiBold">{userData.username}</ThemedText>

            <View style={styles.bioContainer}>
              <ThemedText>Bio:</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Add your bio"
                placeholderTextColor="gray"
                selectionColor="gray"
                multiline
                value={bioText}
                onChangeText={(text) => setBioText(text)}
              />
            </View>

            <CategoryPicker
              open={categoryOpen}
              setOpen={setCategoryOpen}
              onOpen={() => {}}
              selectedTags={selectedTag}
              setSelectedTags={setSelectedTag}
              max={1}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={debouncePress(() =>
                handleSave(userData.uid, {
                  bio: bioText,
                  category: selectedTag,
                })
              )}
            >
              <Text style={styles.buttonText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const makeStyles = (colorScheme: any) =>
  StyleSheet.create({
    mainContainer: {
      paddingHorizontal: s(15),
      paddingVertical: vs(15),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#7b68ee",
    },
    profileContainer: {
      alignItems: "center",
      gap: vs(14),
    },
    profilePic: {
      width: PROFILEPICSIZE,
      height: PROFILEPICSIZE,
      borderRadius: PROFILEPICSIZE / 2,
    },
    bioContainer: {
      backgroundColor: "transparent",
      borderColor: "#7b68ee",
      flexDirection: "row",
      gap: s(8),
      alignItems: "center",
    },
    input: {
      flex: 1,
      height: vs(35),
      borderColor: "#7b68ee",
      borderWidth: 1,
      paddingHorizontal: s(10),
      borderRadius: 10,
      color: colorScheme === "dark" ? "white" : "black",
      backgroundColor: "transparent",
    },
    button: {
      paddingHorizontal: s(15),
      paddingVertical: vs(5),
      borderRadius: 10,
      backgroundColor: "#66cdaa",
    },
    buttonText: {
      fontSize: RFValue(12),
      color: "black",
    },
  });
