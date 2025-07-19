import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Alert } from "react-native";
import { ms, s, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import { ScrollView } from "react-native-gesture-handler";
import { Activity } from "@/types/activity";
import { addFriend, rejectFriend, deleteInvite } from "@/firebase/firestore";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";

type NotifProps = {
  visible: boolean;
  onClose: () => void;
  items: Activity[];
  userId: string;
  setActivities: React.Dispatch<React.SetStateAction<Activity[] | null>>;
  testID?: string;
};

export default function Notifications({
  visible,
  onClose,
  items,
  userId,
  setActivities,
  testID,
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

  const handleDismiss = async (id: string) => {
    try {
      await deleteInvite(id);
      setActivities((prev) => prev?.filter((item) => item.id !== id) || []);
    } catch (error) {
      Alert.alert("Error", "Failed to dismiss notification.");
    }
  };

  return (
    <Modal
      testID={testID}
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
              testID="notif-list"
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
                  testID="notif-item"
                  item={item}
                  userId={userId}
                  isProcessing={isProcessing}
                  handleAccept={handleAccept}
                  handleReject={handleReject}
                  handleDismiss={handleDismiss}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
  handleDismiss: (id: string) => void;
  testID: string,
};

function NotificationItem({
  item,
  userId,
  isProcessing,
  handleAccept,
  handleReject,
  handleDismiss,
  testID,
}: NotifItemProps) {
  return (
    <View testID={testID} style={styles.notifContainer}>
      {item.type === "friend" && (
        <View style={styles.notifItem}>
          <View style={styles.textContainer}>
            <ThemedText style={styles.textContainer}>
              {item.senderName} sent you a friend request.
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleAccept(userId, item.senderId, item.id)}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleReject(item.id)}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {item.type === "sublist" && (
        <View style={styles.notifItem}>
          <ThemedText style={styles.textContainer}>
            {item.senderName} added you to {item.sublistTitle}.
          </ThemedText>

          <TouchableOpacity onPress={() => handleDismiss(item.id)}>
            <Ionicons name="close-circle" size={ms(22)} color="#6a5acd" />
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flexWrap: "wrap",
    flex: 1,
    alignItems: "center",
    fontSize: 14,
  },
  buttonContainer: {
    gap: s(8),
    flexDirection: "row",
  },
  button: {
    backgroundColor: "#6a5acd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 13,
  },
});
