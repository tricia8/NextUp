import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Alert } from "react-native";
import { s, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import { ScrollView } from "react-native-gesture-handler";
import { Activity } from "@/types/activity";
import { addFriend, rejectFriend } from "@/firebase/firestore";

type NotifProps = {
  visible: boolean;
  onClose: () => void;
  items: Activity[];
  userId: string;
  setFriendRequests: React.Dispatch<React.SetStateAction<Activity[] | null>>;
};

export default function Notifications({
  visible,
  onClose,
  items,
  userId,
  setFriendRequests,
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
      setFriendRequests(
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
      setFriendRequests(
        (prev) => prev?.filter((request) => request.id !== requestId) || []
      );
    } catch (error) {
      console.log("Error rejecting friend:", error);
      Alert.alert("Error rejecting request.");
    } finally {
      setIsProcessing(false);
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
            {items.length === 0 ? (
              <View>
                <ThemedText>No notifications</ThemedText>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.notifItems}>
                  {item.type === "friend" && (
                    <View style={styles.friendReq}>
                      <ThemedText>
                        ${item.senderName} sent you a friend request
                      </ThemedText>

                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.button}
                          onPress={() =>
                            handleAccept(userId, item.senderId, item.id)
                          }
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
                    <ThemedText>
                      ${item.senderName} added you to ${item.sublistTitle}
                    </ThemedText>
                  )}
                </View>
              ))
            )}
          </ThemedView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#66cdaa",
    gap: vs(6),
  },
  notifItems: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendReq: {
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
