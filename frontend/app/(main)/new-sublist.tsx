import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { FloatingLabelInput } from "react-native-floating-label-input";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { RFValue } from "react-native-responsive-fontsize";
import { ThemedView } from "@/components/ThemedView";
import ShareListModal from "@/components/ShareListModal";
import { Dimensions } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import SublistField from "@/components/forms/SublistField";

export default function newSubList() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const theme = colorScheme == "dark" ? "DARK" : "LIGHT";

  // For access picker
  const [accessLevel, setAccessLevel] = useState("");
  const [open, setOpen] = useState(false);
  const accessOptions = [
    {
      label: "Only you can view",
      value: "private",
      icon: () => (
        <Feather
          name="user"
          size={24}
          color={colorScheme == "dark" ? "white" : "black"}
        />
      ),
    },
    {
      label: "Only friends can view",
      value: "friends",
      icon: () => (
        <Feather
          name="users"
          size={24}
          color={colorScheme == "dark" ? "white" : "black"}
        />
      ),
    },
    {
      label: "Everyone (any user) can view",
      value: "everyone",
      icon: () => (
        <SimpleLineIcons
          name="globe"
          size={24}
          color={colorScheme == "dark" ? "white" : "black"}
        />
      ),
    },
  ];

  const submit = () => {
    router.push("/(main)/current-sublist");
    showMessage({
      message: "Success!",
      description: "New sublist added",
      type: "success",
      statusBarHeight: StatusBar.currentHeight, //Android only
      floating: true,
      icon: "success",
    });
  };

  interface User {
    username: string;
  }

  // dummy data
  const DATA: User[] = [
    {
      // profile icon (to add),
      username: "ez123 (You)",
    },
    {
      username: "me321",
    },
    {
      username: "bluess",
    },
  ];

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <ShareListModal
          data={DATA}
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
            <DropDownPicker
              open={open}
              value={accessLevel}
              items={accessOptions}
              setOpen={setOpen}
              setValue={setAccessLevel}
              listMode="SCROLLVIEW"
              theme={theme}
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
