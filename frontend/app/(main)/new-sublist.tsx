import { ThemedText } from "@/components/ThemedText";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  StyleSheet,
  useColorScheme,
  ColorSchemeName,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedView } from "@/components/ThemedView";
import ShareListModal from "@/components/ShareListModal";
import { Dimensions } from "react-native";
import SublistField from "@/components/forms/SublistField";
import AccessDropdownPicker from "@/components/forms/AccessDropdownPicker";
import { createSubBucketList, getOwnerProfile } from "@/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { User } from "@/types/user";

export default function newSubList() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(colorScheme);
  const theme = isDark ? "DARK" : "LIGHT";

  // Access picker
  const [accessLevel, setAccessLevel] = useState("");

  // Invite collaborators
  const [collaborators, setCollaborators] = useState<User[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchOwner = async () => {
        if (!user?.id) return;

        try {
          const profile = await getOwnerProfile(user.id);
          if (profile) {
            setCollaborators([profile]);
          }
        } catch (error) {
          console.error("Failed to fetch owner profile:", error);
        }
      };

      fetchOwner();
    }, [user?.id])
  );

  // Sublist submission
  const submit = async () => {
    try {
      const sublistId = await createSubBucketList(user?.uid, {
        title,
        description,
        accessLevel,
        collaborators,
      });
      router.push({ pathname: "/(main)/[sublistId]", params: { sublistId } });
      showMessage({
        message: "Success!",
        description: "New sublist added",
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "success",
      });
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create sublist",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <ShareListModal
          ownerId={user?.id}
          data={collaborators}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        <ScrollView>
          <View style={styles.titleShareBar}>
            <SublistField
              label="Title"
              onChangeText={(value) => setTitle(value)}
              value={title}
            />

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="group-add" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <View style={{ marginVertical: 10 }}>
            <SublistField
              label="Description"
              onChangeText={(value) => setDesc(value)}
              value={description}
              multiline={true}
            />
          </View>

          <View style={{ marginVertical: 10 }}>
            <AccessDropdownPicker
              accessLevel={accessLevel}
              onChange={setAccessLevel}
              theme={isDark ? "DARK" : "LIGHT"}
            />
          </View>

          <TouchableOpacity
            onPress={submit}
            style={[styles.addButton, styles.submitButton]}
          >
            <ThemedText>Create Sublist</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get("window").width;
const buttonSize = screenWidth * 0.15;

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    safeView: {
      flex: 1,
    },
    themedView: {
      flex: 1,
      padding: 20,
    },
    titleShareBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginVertical: 10,
    },
    shareButton: {
      backgroundColor: "#46d5c2",
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    addButton: {
      paddingVertical: 13,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      marginVertical: 15,
      backgroundColor: "#46d5c2",
      color: "#fff",
      flexDirection: "row",
      gap: 8,
    },
    submitButton: {
      backgroundColor: "#4d8ce5",
    },
  });
