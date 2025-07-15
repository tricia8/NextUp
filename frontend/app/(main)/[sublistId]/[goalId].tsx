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
} from "react-native";
import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ThemedText } from "@/components/ThemedText";
import TitleDescFields from "@/components/forms/TitleDescFields";
import LoadingScreen from "@/components/Loading";
import { RFValue } from "react-native-responsive-fontsize";
import { showMessage } from "react-native-flash-message";
import { getEvent, updateEvent } from "@/firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { useSublistStore } from "@/stores/sublistStore";
import { useShallow } from "zustand/react/shallow";

export default function GoalPage() {
  const { sublistId, goalId } = useLocalSearchParams();

  const goal = useSublistStore(
    useShallow(
      (state) => state.goalsBySublist[sublistId as string]?.[goalId as string]
    )
  );

  const { addGoalToSublist } = useSublistStore();

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        // Fetch goal from backend if not found in store
        if (!goal && sublistId && goalId) {
          const { goalData, posts } = await getEvent(sublistId, goalId); // goal and array of posts
          addGoalToSublist(sublistId as string, goalData);
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

  if (!goal) return <LoadingScreen />;

  const [isFetching, setIsFetching] = useState(false);

  // Sublist fields for editing
  const [isEditing, setIsEditing] = useState(false);
  const [goalTitle, setTitle] = useState(goal?.title || "Dummy Title");
  const [goalDescription, setDesc] = useState(
    goal?.description || "Dummy Description"
  );
  const [categories, setCategories] = useState(goal?.categories || []);

  // Cache original values
  const [initialTitle, setInitialTitle] = useState(
    goal?.title || "Dummy Title"
  );
  const [initialDescription, setInitialDescription] = useState(
    goal?.description || "Dummy Description"
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

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
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
                  {goalDescription}
                </ThemedText>
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
                  onPress={handleUpdate}
                >
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ marginVertical: 10, gap: 8 }}>
            <ThemedText style={styles.metadata}>
              Updated {goal.updatedAt}
            </ThemedText>
            <ThemedText style={styles.metadata}>
              Status: {goal.isCompleted ? "Completed" : "Pending"}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
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
});
