import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { RFValue } from "react-native-responsive-fontsize";
import { Sublist } from "@/types/sublist";
import { SafeAreaView } from "react-native-safe-area-context";

type DeleteModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  item: Sublist | null;
  handleItemDelete: (sublist: Sublist) => void;
};

export default function DeleteModal({
  modalVisible,
  setModalVisible,
  item,
  handleItemDelete,
}: DeleteModalProps) {
  if (!item) {
    return null;
  }
  const handleDelete = () => {
    handleItemDelete(item);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, zIndex: 1000 }}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
          onPress={() => setModalVisible(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              width: "80%",
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              elevation: 3,
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontSize: RFValue(15), marginBottom: 20 }}>
              Are you sure you want to delete this sublist? Every goal in this
              list, including completed goals, will be deleted as well. This
              action cannot be undone."
            </ThemedText>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  backgroundColor: "#ff4d4d",
                  margin: 10,
                  paddingVertical: 10,
                  borderRadius: 5,
                  alignItems: "center",
                }}
              >
                <ThemedText style={{ color: "#fff", fontSize: RFValue(14) }}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  margin: 10,
                  paddingVertical: 10,
                  borderRadius: 5,
                  alignItems: "center",
                }}
              >
                <ThemedText style={{ color: "#007bff", fontSize: RFValue(14) }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
