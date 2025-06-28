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
import {
  addEvent,
  getAllEventsFormatted,
  getOwnerProfile,
  getSubBucketList,
  updateSubBucketList,
} from "@/firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { showMessage } from "react-native-flash-message";
import { User } from "@/types/user";
import { Goal } from "@/types/goal";
import LoadingScreen from "@/components/Loading";
import { useKeyboardStatus } from "@/hooks/useKeyboardStatus";
import GoalList from "@/components/GoalList";

export default function currentSublist() {
  // Fetching sublist data from firestore
  const { user, loading } = useContext(AuthContext);
  const uid = user?.uid;
  const { sublistId } = useLocalSearchParams();
  console.log("sublistId param:", sublistId);
  const [isFetching, setIsFetching] = useState(true);

  if (loading || !uid || !sublistId) {
    return <LoadingScreen />;
  }

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

  // boolean toggle to trigger re-render
  const [isUpdated, setIsUpdated] = useState(false);

  // keyboard hook
  const keyboardVisible = useKeyboardStatus();

  // Fetched goals
  const [existingGoals, setExistingGoals] = useState<Goal[]>([]);

  useFocusEffect(
    useCallback(() => {
      // Async logic only runs when the required values exist
      let isActive = true;

      const fetchData = async () => {
        try {
          if (user?.uid && sublistId) {
            console.log("Fetching sublist for path:", user.uid, sublistId);

            const sublistData = await getSubBucketList(user.uid, sublistId);

            const goalData = await getAllEventsFormatted(user.uid, sublistId);
            // returns array of events
            // event object: { id, title, description, categories, isCompleted, createdAt, deadline }

            console.log("fetched goals: ", goalData);
            setExistingGoals(goalData);

            if (isActive) {
              setTitle(sublistData.title);
              setDesc(sublistData.description);
              setAccessLevel(sublistData.accessLevel);
              setSharedUids(sublistData.collaborators); // array of uids
              setCreatedAt(sublistData.createdAtFormatted);
              setCompletionStatus(sublistData.completionStatus);
              setExistingGoals(goalData);

              // Cache initial values
              setInitialTitle(sublistData.title);
              setInitialDescription(sublistData.description);

              setIsFetching(false);
              // Fetch owner + collaborators
              const owner = await getOwnerProfile(user.uid);
              const otherProfiles = await Promise.all(
                // Fetches all collaborator profiles in parallel
                sublistData.collaborators
                  .filter(
                    (uid: string | undefined) =>
                      /* uid && uid !== user.uid */ typeof uid === "string" &&
                      uid.length > 0 &&
                      uid !== user.uid
                  )
                  .map((uid: string) => getOwnerProfile(uid))
              );

              setCollaborators([owner, ...otherProfiles]);
            }
          }
        } catch (error) {
          // Handle error
          showMessage({
            message: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to fetch sublist data",
            type: "danger",
            statusBarHeight: StatusBar.currentHeight,
            floating: true,
            icon: "danger",
            duration: 5000,
          });
        }
      };

      fetchData();

      // Do something when the screen is unfocused
      return () => {
        isActive = false; // Avoids setting state after unmount
      };
    }, [uid, sublistId, isUpdated])
  );

  // Share modal
  const [modalVisible, setModalVisible] = useState(false);

  // Colour Styles
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(colorScheme);

  // New Goal info
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

  // Validate required sublist fields
  const [sublistErrors, setSublistErrors] = useState<{
    title?: string;
    accessLevel?: string; // optional
  }>({});

  const validateForm = () => {
    // returns boolean
    const formErrors: typeof sublistErrors = {};
    if (!title) formErrors.title = "Please enter a title";
    if (!accessLevel) formErrors.accessLevel = "Please select an access level"; // extra check (optional)
    setSublistErrors(formErrors);
    return Object.keys(formErrors).length == 0; // check if all required fields are filled
  };

  const handleListTitleChange = (title: string) => {
    setTitle(title);
    if (sublistErrors.title) {
      setSublistErrors((prev) => ({ ...prev, title: "" })); // remove error message when user types something
    }
  };

  const handleAccessChange = (access: string) => {
    setAccessLevel(access);
    if (access && sublistErrors.accessLevel) {
      setSublistErrors((prev) => ({ ...prev, accessLevel: "" })); // remove error message when user selects an access level
    }
  };

  // Sublist update
  const handleSubmission = () => {
    Keyboard.dismiss();

    if (validateForm()) {
      // check if all required fields are filled
      updateSublist();
    } else {
      showMessage({
        message: "Validation Error",
        description: "Please fill in all required fields.",
        type: "warning",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "warning",
        duration: 3000,
      });
    }
  };

  const updateSublist = async () => {
    try {
      setIsEditing(false);
      // Save changes to Firestore
      await updateSubBucketList(uid, sublistId, {
        title,
        description,
        accessLevel,
      });
      setIsUpdated(!isUpdated); // trigger re-render
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update sublist",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });
    }
  };

  // Validate goal form
  const [goalTitleError, setGoalTitleError] = useState("");

  const validateGoalTitle = () => {
    // returns boolean
    if (!goalTitle) {
      setGoalTitleError("Please enter a title");
      return false;
    }
    return true;
  };

  const handleGoalTitleChange = (title: string) => {
    setGoalTitle(title);
    if (goalTitleError) {
      setGoalTitleError("");
    }
  };
  // Goal submission
  const handleGoalSubmission = () => {
    Keyboard.dismiss();

    if (validateGoalTitle()) {
      // check if all required fields are filled
      onSave();
    }
  };

  // Add goal to db
  const onSave = async () => {
    try {
      await addEvent(uid, sublistId, {
        // POST — send new goal to Firestore
        title: goalTitle,
        description: goalDesc,
        categories: selectedTags,
        deadline: deadlineString ? deadlineDate : null, // if deadlineString is empty, set to null
        collaborators: sharedUids,
      });
      console.log("goal added!");

      // GET — fetch updated list from Firestore
      const updatedGoals = await getAllEventsFormatted(uid, sublistId);
      const updatedSublist = await getSubBucketList(uid, sublistId);
      setExistingGoals(updatedGoals); // update state/UI with fresh data
      setCompletionStatus(updatedSublist.completionStatus); // update completion status

      showMessage({
        message: "Success",
        description: "Goal added successfully",
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "success",
      });
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
        duration: 5000,
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

  // Set right header as invite collaborators icon
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
    props: BottomSheetBackdropProps
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
        <View>
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
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
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

              <View style={{ marginVertical: 10 }}>
                <AccessDropdownPicker
                  accessLevel={accessLevel}
                  onChange={setAccessLevel}
                  theme={isDark ? "DARK" : "LIGHT"}
                  isDisabled={true}
                  onChangeValue={(value) => {
                    if (typeof value === "string") handleAccessChange(value);
                  }}
                />
              </View>
            </View>
          )}

          {isEditing && (
            <View style={{ gap: 10 }}>
              <TitleDescFields
                title={title}
                description={description}
                setTitle={handleListTitleChange}
                setDescription={setDesc}
                lightLabelBg="#a2e6ff"
                darkLabelBg="#141515"
              />
              <View style={{ marginVertical: 10 }}>
                <AccessDropdownPicker
                  accessLevel={accessLevel}
                  onChange={setAccessLevel}
                  theme={isDark ? "DARK" : "LIGHT"}
                />
              </View>
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
                  onPress={handleSubmission}
                >
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ marginVertical: 10, gap: 8 }}>
            <ThemedText style={styles.metadata}>Created {createdAt}</ThemedText>
            <ThemedText style={styles.metadata}>
              {completionStatus[0]} of {completionStatus[1]} complete
            </ThemedText>
          </View>

          {/* } <View pointerEvents="box-none"> */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePresentModalPress}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={{ fontSize: RFValue(13) }}>Add Goal</Text>
            <Ionicons name="add-circle-outline" size={22} color="black" />
          </TouchableOpacity>
          {/* </View> */}
        </View>

        <GoalList
          uid={uid}
          sublistId={sublistId as string}
          data={existingGoals}
          updateData={setExistingGoals}
          colorScheme={colorScheme}
        />
      </ThemedView>

      {modalVisible && (
        <View style={{ flex: 1 }}>
          <ShareListModal
            currentUid={user?.uid}
            data={collaborators}
            visible={modalVisible}
            setModalVisible={setModalVisible}
            onClose={() => setModalVisible(false)}
          />
        </View>
      )}

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
          <View style={{ paddingHorizontal: 10, gap: 10 }}>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Title"
              value={goalTitle}
              onChangeText={handleGoalTitleChange}
            />
            {goalTitleError && (
              <ThemedText
                style={styles.errorText}
                lightColor="#c40028"
                darkColor="#ffb1c1"
              >
                {goalTitleError}
              </ThemedText>
            )}
          </View>

          <View>
            <CategoryPicker
              open={categoryOpen}
              setOpen={setCategoryOpen}
              onOpen={onCategoryOpen}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              max={3}
              noun="categories"
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
                themeVariant={isDark ? "dark" : "light"}
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
              style={[styles.input, { flex: 1, padding: 14 }]}
              placeholder="Add details, timelines, or motivations... (Optional)"
              value={goalDesc}
              multiline={true}
              onChangeText={setGoalDesc}
            />
            {goalDesc && keyboardVisible && (
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                }}
                activeOpacity={0.6}
                style={{
                  borderRadius: 24,
                  padding: 5,
                }}
              >
                <Ionicons name="checkmark-circle" size={30} color="#1db363" />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.editHandler, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[styles.editingButton, { backgroundColor: "#dedede" }]}
              onPress={onCancel}
            >
              <ThemedText style={{ color: "#618ce0" }}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editingButton,
                { backgroundColor: "#618ce0", alignItems: "center" },
              ]}
              onPress={handleGoalSubmission}
            >
              <ThemedText>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
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
      elevation: 2,
    },
    titleEditBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    pencilEdit: {
      padding: 12,
      borderRadius: 50,
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
      padding: 15,
      gap: 15,
    },
    modalViewContainer: {
      gap: 15,
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
      padding: 13,
      backgroundColor: "rgba(151, 151, 151, 0.98)",
    },
    metadata: {
      fontStyle: "italic",
      fontSize: RFValue(11),
    },
    errorText: {
      fontSize: RFValue(12),
    },
  });
