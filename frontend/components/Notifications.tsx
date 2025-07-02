import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { s, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import {} from "@/firebase/firestore";
import { ScrollView } from "react-native-gesture-handler";
import { Notif } from "@/types/notif";
import { addFriend } from "@/firebase/firestore";

type NotifProps = {
  visible: boolean;
  onClose: () => void;
  items: Notif[];
  userId: string;
};

export default function Notifications({ visible, onClose, items, userId }: NotifProps) {
  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.4}
      onBackdropPress={onClose}
      animationIn="zoomIn"
      animationOut="zoomOut"
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
                        <TouchableOpacity style={styles.button} onPress={() => addFriend(userId, item.senderId)}>
                            <Text>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button}>
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
    justifyContent: 'space-between',
  },
  buttonContainer: {
    gap: s(4),
  },
  button: {
    color: "#66cdaa",
    borderRadius: 10,
  },
});
