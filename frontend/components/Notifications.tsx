import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { s, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Modal from "react-native-modal";
import {} from "@/firebase/firestore";
import { ScrollView } from "react-native-gesture-handler";
import { Notif } from "@/types/notif";

type NotifProps = {
  visible: boolean;
  onClose: () => void;
  items: Notif[];
};

export default function Notifications({ visible, onClose, items }: NotifProps) {
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
                  <ThemedText>
                    {item.type === 'friend' &&
                        `${item.senderName} sent you a friend request`}
                    {item.type === 'sublist' &&
                        `${item.senderName} added you to "${item.sublistTitle}"`}
                  </ThemedText>
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
    borderColor: "#7b68ee",
    gap: vs(6),
  },
  notifItems: {
    flexDirection: "row",
    alignItems: "center",
  },
});
