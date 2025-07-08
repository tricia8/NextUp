import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Alert } from "react-native";
import { s, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import { ScrollView } from "react-native-gesture-handler";
import { Activity } from "@/types/activity";
import { addFriend, rejectFriend } from "@/firebase/firestore";
import { FlashList } from "@shopify/flash-list";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { SharedValue } from "react-native-reanimated";

type NotifProps = {
  visible: boolean;
  onClose: () => void;
  items: Activity[];
  userId: string;
  setActivities: React.Dispatch<React.SetStateAction<Activity[] | null>>;
};

export default function Notifications({
  visible,
  onClose,
  items,
  userId,
  setActivities,
}: NotifProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async (
    userId: string,
    senderId: string,
    requestId: string
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await addFriend(userId, senderId, requestId);
      setActivities(
        (prev) => prev?.filter((request) => request.id !== requestId) || []
      );
      Alert.alert("Friend added!");
    } catch (error) {
      console.log("Error adding friend:", error);
      Alert.alert("Error accepting request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await rejectFriend(requestId);
      setActivities(
        (prev) => prev?.filter((request) => request.id !== requestId) || []
      );
    } catch (error) {
      console.log("Error rejecting friend:", error);
      Alert.alert("Error", "Failed to reject request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwipe = async (id: string) => {
    try {
      setActivities((prev) => prev?.filter((item) => item.id !== id) || []);
    } catch (error) {
      Alert.alert("Error", "Failed to dismiss notification.");
    }
  };

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.4}
      onBackdropPress={onClose}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      useNativeDriver
    >
      <View>
        <ScrollView>
          <ThemedView style={styles.mainContainer}>
            <FlashList
              data={items}
              keyExtractor={(item) => item.id}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={{ justifyContent: "center" }}>
                  <ThemedText>No notifications</ThemedText>
                </View>
              }
              renderItem={({ item }) => (
                <NotificationItem
                  item={item}
                  userId={userId}
                  isProcessing={isProcessing}
                  handleAccept={handleAccept}
                  handleReject={handleReject}
                  handleSwipe={handleSwipe}
                />
              )}
            />
          </ThemedView>
        </ScrollView>
      </View>
    </Modal>
  );
}

type NotifItemProps = {
  item: Activity;
  userId: string;
  isProcessing: boolean;
  handleAccept: (userId: string, senderId: string, requestId: string) => void;
  handleReject: (requestId: string) => void;
  handleSwipe: (id: string) => void;
};

function NotificationItem({
  item,
  userId,
  isProcessing,
  handleAccept,
  handleReject,
  handleSwipe,
}: NotifItemProps) {
  const renderRightActions = (
    progress: SharedValue<number>,
    dragX: SharedValue<number>
  ) => {
    return (
      <Animated.View style={{ justifyContent: "center" }}>
        <ThemedText>Dismiss</ThemedText>
      </Animated.View>
    );
  };

  return (
    <View style={styles.notifContainer}>
      {item.type === "friend" && (
        <View style={styles.notifItem}>
          <ThemedText>{item.senderName} sent you a friend request.</ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleAccept(userId, item.senderId, item.id)}
              disabled={isProcessing}
            >
              <Text>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleReject(item.id)}
              disabled={isProcessing}
            >
              <Text>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {item.type === "sublist" && (
        <ReanimatedSwipeable
          renderRightActions={renderRightActions}
          onSwipeableOpen={(direction) => {
            if (direction === "right") {
              handleSwipe(item.id);
            }
          }}
          rightThreshold={100}
          friction={2}
          overshootRight={false}
        >
          <View style={styles.notifItem}>
            <ThemedText>
              {item.senderName} added you to {item.sublistTitle}.
            </ThemedText>
          </View>
        </ReanimatedSwipeable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#66cdaa",
  },
  notifContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifItem: {
    justifyContent: "space-between",
  },
  buttonContainer: {
    gap: s(4),
  },
  button: {
    color: "#66cdaa",
    borderRadius: 10,
  },
});
