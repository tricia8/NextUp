import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ColorSchemeName,
  useColorScheme,
  Pressable,
  Keyboard,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import ShareListModal from "@/components/ShareListModal";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";
import TitleDescFields from "@/components/forms/TitleDescFields";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import AccessDropdownPicker from "@/components/forms/AccessDropdownPicker";
import CategoryPicker from "@/components/forms/CategoryPicker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { addEvent, getSubBucketList } from "@/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { showMessage } from "react-native-flash-message";
import { User } from "@/types/user";

export default function currentSublist() {
  // Sublist fields
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");

  // Cache original values
  const [initialTitle, setInitialTitle] = useState("");
  const [initialDescription, setInitialDescription] = useState("");

  const [accessLevel, setAccessLevel] = useState("");
  const [completionStatus, setCompletionStatus] = useState<number[]>([0, 0]); // [completed, total]
  const [sharedUids, setSharedUids] = useState<string[]>([]); // Array of uids
  const [collaborators, setCollaborators] = useState<User[]>([]); // Add owner first?
  const [createdAt, setCreatedAt] = useState("");

  // Fetching sublist data from firestore
  const { user } = useContext(AuthContext);
  const { sublistId } = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      // Async logic only runs when the required values exist
      let isActive = true;

      const fetchData = async () => {
        try {
          if (user?.id && sublistId) {
            const data = await getSubBucketList(user.id, sublistId);

            if (isActive) {
              setTitle(data.title);
              setDesc(data.description);
              setAccessLevel(data.accessLevel);
              setSharedUids(data.collaborators); // array of uids
              setCreatedAt(data.createdAtFormatted);
              setCompletionStatus(data.completionStatus);

              // Cache initial values
              setInitialTitle(data.title);
              setInitialDescription(data.description);

              // fetch Collaborator data
            }
          }
        } catch (error) {
          // Handle error
          showMessage({
            message: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to fetch sublist",
            type: "danger",
            statusBarHeight: StatusBar.currentHeight,
            floating: true,
            icon: "danger",
          });
        }
      };

      fetchData();

      // Do something when the screen is unfocused
      return () => {
        isActive = false;
      };
    }, [user?.id, sublistId])
  );

  // Share modal
  const [modalVisible, setModalVisible] = useState(false);

  // Colour Styles
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(colorScheme);

  // Goal info
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");

  // Category Picker
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // array of strings
  const [categoryOpen, setCategoryOpen] = useState(false);

  //Date-Time Picker
  const [deadlineString, setDeadlineString] = useState(""); // string
  const [deadlineDate, setDeadlineDate] = useState<Date>(new Date()); // deadline in
  const [dateTimeOpen, setDateTimeOpen] = useState(false);

  const onCategoryOpen = useCallback(() => {
    setDateTimeOpen(false);
  }, []);

  const onDateTimeOpen = useCallback(() => {
    setCategoryOpen(false);
  }, []);

  const toggleDatePicker = () => {
    setDateTimeOpen(!dateTimeOpen);
  };

  const onChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    // type refers to event type
    if (event.type === "set" && selectedDate) {
      setDeadlineDate(selectedDate);
      toggleDatePicker(); // hide picker after selection
      setDeadlineString(selectedDate.toDateString());
    } else {
      toggleDatePicker();
    }
  };

  // Goal submission
  const onSave = async () => {
    try {
      await addEvent(user?.uid, sublistId, {
        // POST — send new goal to Firestore
        title: title,
        description: description,
        categories: selectedTags,
        deadline: deadlineDate,
        collaborators: sharedUids,
      });
      console.log("goal added!");
      // const updated = await getGoals(); // GET — fetch updated list from Firestore
      // setGoals(updated); // update state/UI with fresh data
      onCancel(); // reset goal creation fields
    } catch (error) {
      // Handle error
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add goal",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
      });
    }
  };

  const onCancel = () => {
    closeSheet();
    setGoalTitle("");
    setGoalDesc("");
    setDeadlineString("");
    setSelectedTags([]);
  };

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
            color={isDark ? "white" : "black"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Bottom-sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

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
          currentUid={user?.id}
          data={collaborators}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          setModalVisible={setModalVisible}
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
                  color={isDark ? "white" : "black"}
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
                <Text style={{ color: "#618ce0" }}>Cancel</Text>
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

        <View style={{ marginVertical: 10 }}>
          <ThemedText style={styles.completionStatus}>
            {completionStatus[0]} of {completionStatus[1]} complete
          </ThemedText>
        </View>

        <View style={{ marginVertical: 10 }}>
          <AccessDropdownPicker
            accessLevel={accessLevel}
            onChange={setAccessLevel}
            theme={isDark ? "DARK" : "LIGHT"}
          />
        </View>

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
          enableContentPanningGesture={false}
        >
          <BottomSheetScrollView style={styles.contentContainer}>
            <SafeAreaView style={styles.modalViewContainer}>
              <View style={{ paddingHorizontal: 10 }}>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="Title"
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                />
              </View>

              <View>
                <CategoryPicker
                  open={categoryOpen}
                  setOpen={setCategoryOpen}
                  onOpen={onCategoryOpen}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  max={3}
                />
              </View>

              <View>
                {dateTimeOpen && (
                  <DateTimePicker
                    mode="date"
                    display="spinner"
                    value={deadlineDate}
                    onChange={onChange}
                    minimumDate={new Date()}
                  />
                )}

                {!dateTimeOpen && (
                  <Pressable
                    onPress={toggleDatePicker}
                    style={{ paddingHorizontal: 10 }}
                  >
                    <View pointerEvents="none">
                      <BottomSheetTextInput
                        placeholder={"End Date (Optional)"}
                        value={deadlineString}
                        style={styles.input}
                        onEndEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  </Pressable>
                )}
              </View>

              <View
                style={{
                  paddingHorizontal: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <BottomSheetTextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Add details, timelines, or motivations..."
                  value={goalDesc}
                  multiline={true}
                  onChangeText={setGoalDesc}
                />
                <Ionicons name="checkmark-circle" size={28} color="#1db363" />
              </View>

              <View style={styles.editHandler}>
                <TouchableOpacity
                  style={[styles.editingButton, { backgroundColor: "#f4f1f0" }]}
                  onPress={onCancel}
                >
                  <ThemedText style={{ color: "#618ce0" }}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.editingButton,
                    { backgroundColor: "#618ce0", alignItems: "center" },
                  ]}
                  onPress={onSave}
                >
                  <ThemedText>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
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
      gap: 17,
      paddingHorizontal: 5,
    },
    modalBg: {
      borderRadius: 25,
      backgroundColor: colorScheme == "dark" ? "#1e1e2f" : "#eee",
    },
    input: {
      marginTop: 8,
      marginBottom: 10,
      borderRadius: 10,
      fontSize: 16,
      lineHeight: 20,
      padding: 8,
      backgroundColor: "rgba(151, 151, 151, 0.25)",
    },
    completionStatus: {
      fontStyle: "italic",
      fontSize: RFValue(12),
    },
  });
