import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  useColorScheme,
  Keyboard,
  StatusBar,
  Pressable,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { useContext, useEffect, useMemo, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ThemedText } from "@/components/ThemedText";
import TitleDescFields from "@/components/forms/TitleDescFields";
import LoadingScreen from "@/components/Loading";
import { RFValue } from "react-native-responsive-fontsize";
import { showMessage } from "react-native-flash-message";
import {
  formatEventData,
  formatPostData,
  getEvent,
  getOwnerProfile,
  toggleEventCompletion,
  updateEvent,
} from "@/firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { useSublistStore } from "@/stores/sublistStore";
import { useShallow } from "zustand/react/shallow";
import { Post } from "@/types/post";
import CategoryPicker from "@/components/forms/CategoryPicker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { debouncePress } from "@/utils/debouncePress";
import { FloatingLabelInput } from "react-native-floating-label-input";
import CategoryChips from "@/components/CategoryChips";
import PostForm from "@/components/PostForm";
import AddPostButton from "@/components/AddPostButton";
import PostList from "@/components/PostList";
import { AuthContext } from "@/context/AuthContext";
import { ScrollView } from "react-native-gesture-handler";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { PostWithPending } from "@/types/postWithPending";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user";

export default function GoalPage() {
  const { user } = useContext(AuthContext);
  // Fetch user from zustand store
  const userProfile = useUserStore(useShallow((state) => state.user));
  // const uid = user?.uid;
  const { sublistId, goalId } = useLocalSearchParams();

  const goal = useSublistStore(
    useShallow(
      (state) => state.goalsBySublist[sublistId as string]?.[goalId as string]
    )
  );

  const ownerId = useSublistStore(
    useShallow((state) => state.sublistData[sublistId as string]?.ownerId)
  );

  const { addGoalToSublist, updateGoalForSublist, setPostsForGoal } =
    useSublistStore();

  const posts = useSublistStore(
    useShallow(
      (state) =>
        state.postsByGoal[goalId as string] ||
        ({} as Record<string, PostWithPending>)
    )
  );

  const postOrderByGoal = useSublistStore(
    useShallow((state) => state.postOrderByGoal[goalId as string] || [])
  );

  const postList = useMemo(() => {
    return postOrderByGoal?.map((id) => posts?.[id]) ?? [];
  }, [posts, postOrderByGoal]);

  useEffect(() => {
    // Fetch goal data when component mounts
    const fetchGoal = async () => {
      try {
        // Fetch goal from backend if not found in store
        if (!goal && sublistId && goalId) {
          const { goalData, posts } = await getEvent(sublistId, goalId); // goal and array of posts
          addGoalToSublist(sublistId as string, goalData);
          const postsRecord: Record<string, PostWithPending> = {};
          const postOrder: string[] = [];

          posts.forEach((post: Post) => {
            postsRecord[post.id] = { ...post, isPending: false }; // add isPending flag
            postOrder.push(post.id);
          });

          setPostsForGoal(goalId as string, postsRecord, postOrder);
        }
      } catch (error) {
        showMessage({
          message: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch goal",
          type: "danger",
          statusBarHeight: StatusBar.currentHeight,
          floating: true,
          icon: "danger",
          duration: 5000,
        });
      }
    };

    fetchGoal();
  }, [goal, sublistId, goalId]);

  useEffect(() => {
    // Fetch user data if null when component mounts
    const fetchUserData = async () => {
      try {
        // Fetch user data if not already in store
        if (!userProfile && user?.uid) {
          const fetchedUserProfile = await getOwnerProfile(user.uid);
          useUserStore.getState().setUser(fetchedUserProfile as User);
        }
      } catch (error) {
        showMessage({
          message: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch goal",
          type: "danger",
          statusBarHeight: StatusBar.currentHeight,
          floating: true,
          icon: "danger",
          duration: 5000,
        });
      }
    };

    fetchUserData();
  }, [user, userProfile]);

  useFocusEffect(
    useCallback(() => {
      const goalRef = doc(
        db,
        "users",
        ownerId,
        "bucketList",
        sublistId as string,
        "events",
        goalId as string
      );

      const postsRef = collection(
        db,
        "users",
        ownerId,
        "bucketList",
        sublistId as string,
        "events",
        goalId as string,
        "posts"
      );
      const q = query(postsRef, orderBy("createdAt", "desc"));

      const unsubGoal = onSnapshot(goalRef, (docSnap) => {
        const updatedData = formatEventData(docSnap.data());

        updateGoalForSublist(sublistId as string, {
          id: goalId as string,
          ...updatedData,
        });
      });

      const unSubPosts = onSnapshot(q, (snapShot) => {
        const posts = snapShot.docs.map((doc) => ({
          id: doc.id,
          ...formatPostData(doc.data()),
          isPending: false,
        }));

        console.log("Posts from Firestore:", posts);

        const postsRecord: Record<string, PostWithPending> = {};
        const postOrder: string[] = [];

        posts.forEach((post) => {
          postsRecord[post.id] = {
            ...post,
          };
          postOrder.push(post.id);
        });
        setPostsForGoal(goalId as string, postsRecord, postOrder);
      });

      return () => {
        unsubGoal();
        unSubPosts();
      };
    }, [goalId])
  );

  if (!goal) return <LoadingScreen />;

  const [isFetching, setIsFetching] = useState(false);

  // Goal fields for editing
  const [isEditing, setIsEditing] = useState(false);
  const [goalTitle, setTitle] = useState(goal?.title || "");
  const [goalDescription, setDesc] = useState(goal?.description || "");

  // Date Time picker
  const [deadlineString, setDeadlineString] = useState(""); // string
  const [deadlineDate, setDeadlineDate] = useState<Date>(new Date());
  const [dateTimeOpen, setDateTimeOpen] = useState(false);

  const [categories, setCategories] = useState(goal?.categories || []);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const onCategoryOpen = () => {
    Keyboard.dismiss();
  };

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

  // Toggle goal completion
  const [isDone, setIsDone] = useState(goal.isCompleted ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleToggle = debouncePress(async () => {
    setIsUpdating(true);
    try {
      setIsDone((previousState) => !previousState);
      await toggleEventCompletion(sublistId, goalId);
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  });

  // Cache original values
  const [initialTitle, setInitialTitle] = useState(goal?.title || "");
  const [initialDescription, setInitialDescription] = useState(
    goal?.description || ""
  );
  const [initialCategories, setInitialCategories] = useState(
    goal?.categories || []
  );
  const [initialDeadline, setInitialDeadline] = useState(goal?.deadline || "");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [titleErrorMsg, setTitleErrorMsg] = useState("");

  const validateGoalTitle = () => {
    // returns boolean
    if (!goalTitle) {
      setTitleErrorMsg("Please enter a title");
      return false;
    }
    return true;
  };

  const handleGoalTitleChange = (title: string) => {
    setTitle(title);
    if (titleErrorMsg) {
      setTitleErrorMsg(""); // remove error message when user types something
    }
  };

  // Goal metadata update
  const handleUpdate = () => {
    Keyboard.dismiss();

    if (validateGoalTitle()) {
      // check if all required fields are filled
      updateGoal();
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

  const updateGoal = async () => {
    try {
      setIsEditing(false);
      // Save changes to Firestore
      await updateEvent(sublistId, goalId, {
        goalTitle,
        goalDescription,
        categories,
      });
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

  // Add new post
  const [isPostFormVisible, setIsPostFormVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={"height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
          <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
            <View>
              {!isEditing &&
                (isFetching ? (
                  <LoadingScreen />
                ) : (
                  <View style={{ gap: 10 }}>
                    <View style={styles.titleEditBar}>
                      <ThemedText
                        type="title"
                        style={{
                          flexShrink: 1, // shrink if needed so no overflowing occurs
                        }}
                      >
                        {goalTitle}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => {
                          setIsEditing(true);
                          setIsPostFormVisible(false); // close post form if open
                        }}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      >
                        <Feather
                          name="edit-2"
                          size={24}
                          color={isDark ? "white" : "black"}
                        />
                      </TouchableOpacity>
                    </View>

                    <ThemedText
                      type="defaultSemiBold"
                      style={{ flexWrap: "wrap" }}
                    >
                      {goalDescription}
                    </ThemedText>

                    <CategoryChips
                      selectedTags={goal.categories}
                      style={{ elevation: 5 }}
                    />
                    {goal.deadline && (
                      <ThemedText
                        style={styles.metadata}
                        lightColor="#b72222"
                        darkColor="#fb6e6e"
                      >
                        Due {goal.deadline}
                      </ThemedText>
                    )}
                  </View>
                ))}

              {isEditing && (
                <View style={{ gap: 10 }}>
                  <TitleDescFields
                    title={goalTitle}
                    description={goalDescription}
                    setTitle={handleGoalTitleChange}
                    setDescription={setDesc}
                    lightLabelBg="#a2e6ff"
                    darkLabelBg="#141515"
                  />
                  <CategoryPicker
                    open={categoryOpen}
                    setOpen={setCategoryOpen}
                    onOpen={onCategoryOpen}
                    selectedTags={categories}
                    setSelectedTags={setCategories}
                    max={3}
                    noun="categories"
                  />
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
                          <FloatingLabelInput
                            value={deadlineString}
                            style={styles.input}
                            label={"End Date (Optional)"}
                          />
                        </View>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.editHandler}>
                    <TouchableOpacity
                      style={[
                        styles.editingButton,
                        { backgroundColor: "#f4f1f0" },
                      ]}
                      onPress={() => {
                        setTitle(initialTitle);
                        setDesc(initialDescription);
                        setCategories(initialCategories);
                        setDeadlineString(initialDeadline);
                        setIsEditing(false);
                      }}
                    >
                      <Text style={{ color: "#618ce0" }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.editingButton,
                        { backgroundColor: "#618ce0" },
                      ]}
                      onPress={handleUpdate}
                    >
                      <Text>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ marginVertical: 5, gap: 8 }}>
                <ThemedText style={styles.metadata}>
                  Updated {goal.updatedAt}
                </ThemedText>

                <ThemedText style={styles.metadata}>
                  Status: {goal.isCompleted ? "Completed" : "Pending"}
                </ThemedText>
                <View
                  style={[
                    styles.titleEditBar,
                    { justifyContent: "flex-start", alignItems: "center" },
                  ]}
                >
                  <ThemedText style={styles.metadata}>Done?</ThemedText>
                  <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isDone ? "#caffbf" : "#ffe5b5"}
                    onValueChange={handleToggle}
                    value={isDone}
                    style={{
                      alignSelf: "flex-start",
                    }}
                  />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <AddPostButton
                  isVisible={!isPostFormVisible}
                  setIsPostFormVisible={setIsPostFormVisible}
                  isDark={isDark}
                  onPress={() => setIsEditing(false)} // close edit mode when adding post
                />
                {userProfile && (
                  <PostForm
                    sublistId={sublistId as string}
                    isVisible={isPostFormVisible}
                    setIsVisible={setIsPostFormVisible}
                    user={userProfile}
                    goalId={goalId as string}
                  />
                )}
                <PostList
                  ownerId={ownerId}
                  userId={user?.uid as string}
                  sublistId={sublistId as string}
                  goalId={goalId as string}
                  posts={postList}
                  colorScheme={colorScheme}
                />
              </View>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
  },
  themedView: {
    flex: 1,
    padding: 20,
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
  titleEditBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metadata: {
    fontStyle: "italic",
    fontSize: RFValue(11),
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
});
