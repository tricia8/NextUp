import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  useColorScheme,
  ColorSchemeName,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { FloatingLabelInput } from "react-native-floating-label-input";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";
import { ThemedView } from "@/components/ThemedView";
import ShareListModal from "@/components/ShareListModal";
import { Dimensions } from "react-native";

export default function newSubList() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const submit = () => {
    router.push("./(tabs)/bucketlist");
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
            <FloatingLabelInput
              label={"Title"}
              value={title}
              onChangeText={(value) => setTitle(value)}
              inputStyles={{ color: colorScheme == "dark" ? "white" : "black" }}
              containerStyles={styles.inputContainer}
              staticLabel
              labelStyles={styles.floatingLabel}
              customLabelStyles={{
                colorFocused: colorScheme == "dark" ? "#aee690" : "#0e8f4a",
                colorBlurred: colorScheme == "dark" ? "#74b552" : "#16ac5c",
              }}
            />

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="group-add" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <View style={{ marginVertical: 10 }}>
            <FloatingLabelInput
              label={"Description"}
              value={description}
              onChangeText={(value) => setDesc(value)}
              multiline={true}
              inputStyles={{ color: colorScheme == "dark" ? "white" : "black" }}
              staticLabel
              labelStyles={styles.floatingLabel}
              containerStyles={styles.inputContainer}
              customLabelStyles={{
                colorFocused: colorScheme == "dark" ? "#aee690" : "#0c6736",
                colorBlurred: colorScheme == "dark" ? "#74b552" : "#16ac5c",
              }}
            />
          </View>

          <TouchableOpacity style={styles.addButton}>
            <Text style={{ fontSize: RFValue(13) }}>Add Goal</Text>
            <Ionicons name="add-circle-outline" size={22} color="black" />
          </TouchableOpacity>

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
    modalContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    card: {
      width: "90%",
      padding: 20,
      backgroundColor: "white",
      borderRadius: 8,
    },
    itemContainer: {
      flexDirection: "column",
      marginVertical: 8,
      marginHorizontal: 15,
      padding: 20,
      justifyContent: "space-between",
      borderRadius: 5,
      elevation: 5,
    },
    statusText: {
      fontSize: RFValue(11),
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
    inputContainer: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colorScheme == "dark" ? "white" : "black",
      padding: 10,
    },
    floatingLabel: {
      backgroundColor: colorScheme == "dark" ? "#141515" : "#a2e6ff",
      paddingHorizontal: 5,
    },
  });
