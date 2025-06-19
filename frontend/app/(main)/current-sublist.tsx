import SublistField from "@/components/SublistField";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ColorSchemeName,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import ShareListModal from "@/components/ShareListModal";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";
import TitleDescFields from "@/components/forms/TitleDescFields";
import { useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

interface User {
  username: string;
}

interface SublistFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialAccess?: string;
  users: User[];
  onSubmit: (title: string, description: string, access: string) => void;
}

export default function currentSublist({
  initialTitle = "Title", // Dummy Placeholder for UI check
  initialDescription = "Description", // Dummy Placeholder for UI check
  initialAccess = "",
  users,
  onSubmit,
}: SublistFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDesc] = useState(initialDescription);
  const [accessLevel, setAccessLevel] = useState(initialAccess);
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  // set right header as invite collaborators icon
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ marginRight: 12 }}
        >
          <MaterialIcons
            name="group-add"
            size={30}
            color={colorScheme == "dark" ? "white" : "black"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Bottom-sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []); // logs to console when snapPoint changes

  const renderBackdrop: React.FC<BottomSheetBackdropProps> = (
    props: BottomSheetBackgroundProps
  ) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close" // closes modal when user presses backdrop
    />
  );

  const closeSheet = () => bottomSheetModalRef.current?.dismiss();

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <ShareListModal
          data={users}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        {!isEditing && (
          <View style={{ gap: 10 }}>
            <View style={styles.titleEditBar}>
              <ThemedText
                type="title"
                style={{
                  flexShrink: 1, // shrink if needed so no overflowing occurs
                }}
              >
                {title}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Feather
                  name="edit-2"
                  size={24}
                  color={colorScheme == "dark" ? "white" : "black"}
                />
              </TouchableOpacity>
            </View>

            <ThemedText type="defaultSemiBold" style={{ flexWrap: "wrap" }}>
              {description}
            </ThemedText>
          </View>
        )}

        {isEditing && (
          <View style={{ gap: 10 }}>
            <TitleDescFields
              title={title}
              description={description}
              setTitle={setTitle}
              setDescription={setDesc}
              lightLabelBg="#a2e6ff"
              darkLabelBg="#141515"
            />
            <View style={styles.editHandler}>
              <TouchableOpacity
                style={[styles.editingButton, { backgroundColor: "#f4f1f0" }]}
                onPress={() => {
                  setTitle(initialTitle);
                  setDesc(initialDescription);
                  setIsEditing(false);
                }}
              >
                <Text style={{ color: "#618ce0" }}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editingButton, { backgroundColor: "#618ce0" }]}
                onPress={() => {
                  setIsEditing(false);
                }}
              >
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handlePresentModalPress}
        >
          <Text style={{ fontSize: RFValue(13) }}>Add Goal</Text>
          <Ionicons name="add-circle-outline" size={22} color="black" />
        </TouchableOpacity>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={2}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          keyboardBehavior={"extend"}
          enablePanDownToClose
          backgroundStyle={styles.modalBg}
        >
          <BottomSheetScrollView style={styles.contentContainer}>
            <View style={styles.modalViewContainer}>
              <TitleDescFields
                title={title}
                description={description}
                setTitle={setTitle}
                setDescription={setDesc}
                lightLabelBg="#eee"
                darkLabelBg="#1e1e2f"
              />

              <TouchableOpacity
                style={[styles.editingButton, { backgroundColor: "#618ce0" }]}
                onPress={() => {
                  closeSheet();
                  // add logic for saving to db and updating current screen
                }}
              >
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </ThemedView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    safeView: {
      flex: 1,
    },
    themedView: {
      flex: 1,
      padding: 20,
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
    titleEditBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    editingButton: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 20,
    },
    editHandler: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    contentContainer: {
      backgroundColor: colorScheme == "dark" ? "#1e1e2f" : "#eee",
      padding: 12,
    },
    modalViewContainer: {
      gap: 10,
    },
    modalBg: {
      borderRadius: 25,
      backgroundColor: colorScheme == "dark" ? "#1e1e2f" : "#eee",
    },
  });
