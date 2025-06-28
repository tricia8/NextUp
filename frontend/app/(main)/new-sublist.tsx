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
  Keyboard,
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
import LoadingScreen from "@/components/Loading";
import { RFValue } from "react-native-responsive-fontsize";

export default function newSubList() {
  const { user, loading } = useContext(AuthContext);
  if (loading || !user?.uid) {
    return <LoadingScreen />;
  }
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
  const [sharedUids, setSharedUids] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<User[]>([]);

  // Validate required fields
  const [errors, setErrors] = useState<{
    title?: string;
    accessLevel?: string;
  }>({});

  const validateForm = () => {
    // returns boolean
    const formErrors: typeof errors = {};
    if (!title) formErrors.title = "Please enter a title";
    if (!accessLevel) formErrors.accessLevel = "Please select an access level";
    setErrors(formErrors);
    return Object.keys(formErrors).length == 0; // check if all required fields are filled
  };

  const handleTitleChange = (title: string) => {
    setTitle(title);
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: "" })); // remove error message when user types something
    }
  };

  const handleAccessChange = (access: string) => {
    setAccessLevel(access);
    if (access && errors.accessLevel) {
      setErrors((prev) => ({ ...prev, accessLevel: "" })); // remove error message when user selects an access level
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect triggered");

      const fetchOwner = async () => {
        console.log("user?.uid", user?.uid);

        if (!user?.uid) return;

        try {
          const profile = (await getOwnerProfile(user.uid)) as User;
          console.log("Owner profile:", profile);

          if (profile) {
            setCollaborators([profile]);
            setSharedUids([profile.uid]);
          }
          console.log("collaborators", collaborators);
        } catch (error) {
          console.error("Failed to fetch owner profile:", error);
        }
      };

      fetchOwner();
    }, [user?.uid])
  );

  // Sublist submission
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    try {
      const sublistId = await createSubBucketList(user?.uid, {
        title,
        description,
        accessLevel,
        collaborators: sharedUids,
      });
      // Delay to allow Firestore to propagate the new document
      await new Promise((res) => setTimeout(res, 300));

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
        duration: 5000,
      });
    }
  };

  const handleSubmission = () => {
    Keyboard.dismiss();

    if (validateForm()) {
      setIsLoading(true);
      submit();
      setIsLoading(false);
    } else {
      showMessage({
        message: "Validation Error",
        description: "Please fill in all required fields.",
        type: "warning",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "warning",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <ScrollView>
          <View style={styles.titleShareBar}>
            <SublistField
              label="Title *"
              onChangeText={handleTitleChange}
              value={title}
            />
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="group-add" size={35} color="black" />
            </TouchableOpacity>
          </View>
          {errors.title && (
            <ThemedText
              style={styles.errorText}
              lightColor="#c40028"
              darkColor="#ffb1c1"
            >
              {errors.title}
            </ThemedText>
          )}

          <View style={{ marginVertical: 10 }}>
            <SublistField
              label="Description"
              onChangeText={(value) => setDesc(value)}
              value={description}
              multiline={true}
            />
          </View>

          <View style={{ zIndex: 990, marginVertical: 10 }}>
            <AccessDropdownPicker
              accessLevel={accessLevel}
              onChange={setAccessLevel}
              theme={isDark ? "DARK" : "LIGHT"}
              onChangeValue={(value) => {
                if (typeof value === "string") handleAccessChange(value);
              }}
            />
          </View>
          {errors.accessLevel && (
            <ThemedText
              style={styles.errorText}
              lightColor="#c40028"
              darkColor="#ffb1c1"
            >
              {errors.accessLevel}
            </ThemedText>
          )}

          <TouchableOpacity
            onPress={handleSubmission}
            style={[styles.addButton, styles.submitButton]}
          >
            <ThemedText>Create Sublist</ThemedText>
          </TouchableOpacity>
        </ScrollView>
        <View style={{ flex: 1 }}>
          <ShareListModal
            currentUid={user?.uid}
            data={collaborators} // User[]
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            setModalVisible={setModalVisible}
          />
        </View>
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
    errorText: {
      fontSize: RFValue(12),
    },
  });
