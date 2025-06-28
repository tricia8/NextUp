import { deleteEvent } from "@/firebase/firestore";
import { Goal } from "@/types/goal";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ColorSchemeName, StatusBar, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import GoalCard from "./GoalCard";
import SwipeableRow from "./SwipeableRow";
import { FlashList } from "@shopify/flash-list";
import DeleteModal from "./DeleteModal";

interface ItemProps {
  uid: string;
  sublistId: string;
  data: Goal[];
  updateData: React.Dispatch<React.SetStateAction<Goal[]>>;
  toggleVersion?: () => void; // optional, used to trigger refetch of data
  colorScheme: ColorSchemeName;
}

export default function GoalList({
  uid,
  sublistId,
  data,
  updateData,
  toggleVersion,
  colorScheme,
}: ItemProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Goal | null>(null);

  // Delete modal text
  const heading = "Are you sure you want to delete this goal?";
  const body = "This action cannot be undone.";

  // delete goal
  const handleDelete = async (goal: Goal) => {
    try {
      console.log("deleting goal");
      console.log("userid", uid);
      console.log("sublist id", sublistId);
      await deleteEvent(uid, sublistId, goal.id);
      console.log("deleted!");
      updateData((prevGoals) =>
        prevGoals.filter((item) => item.id !== goal.id)
      );
      setModalVisible(false); // close modal after deletion
      showMessage({
        message: "Success",
        description: "Goal deleted successfully",
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "success",
        duration: 5000,
      });
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Error deleting goal",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });
    }
  };

  const handleGoalPress = (item: Goal) => {
    router.push({
      pathname: "/(main)/[sublistId]/[goalId]",
      params: { sublistId, goalId: item.id },
    });
  };

  const renderFlashListItem = ({ item }: { item: Goal }) => (
    <SwipeableRow
      onDelete={() => {
        setSelectedItem(item);
        setModalVisible(true);
      }}
    >
      <GoalCard
        title={item.title}
        isCompleted={item.isCompleted}
        categories={item.categories}
        deadline={item.deadline}
        onPress={() => handleGoalPress(item)} // dynamic routing to [goalId].tsx
        colorScheme={colorScheme}
      />
    </SwipeableRow>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        renderItem={renderFlashListItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={130}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <DeleteModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        item={selectedItem}
        handleItemDelete={(item) => {
          // type check to ensure item is a Goal
          if (item && "categories" in item) {
            handleDelete(item);
          }
        }}
        heading={heading}
        body={body}
      />
    </View>
  );
}
