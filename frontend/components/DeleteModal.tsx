import {
  Modal,
  Pressable,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { RFValue } from "react-native-responsive-fontsize";
import { Sublist } from "@/types/sublist";
import { SafeAreaView } from "react-native-safe-area-context";
import { Goal } from "@/types/goal";
import { PostWithPending } from "@/types/postWithPending";

type DeleteModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  item: Sublist | Goal | PostWithPending | null;
  handleItemDelete: (item: Sublist | Goal | PostWithPending) => void;
  heading: string;
  body: string;
};

export default function DeleteModal({
  modalVisible,
  setModalVisible,
  item,
  handleItemDelete,
  heading,
  body,
}: DeleteModalProps) {
  const colorScheme = useColorScheme();

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
            backgroundColor: "rgba(0, 0, 0, 0.44)",
          }}
          onPress={() => setModalVisible(false)}
        >
          <ThemedView
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              width: "80%",
              padding: 20,
              borderRadius: 10,
              elevation: 3,
              alignItems: "center",
              backgroundColor: colorScheme === "dark" ? "#393939" : "#e5e5e5",
            }}
          >
            <ThemedText
              type="subtitle"
              style={{
                fontSize: RFValue(16),
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {heading}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: RFValue(13),
                marginBottom: 16,
              }}
            >
              {body}
            </ThemedText>
            <View
              style={{ flexDirection: "row", justifyContent: "space-around" }}
            >
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  backgroundColor: "#ec4b6a",
                  margin: 10,
                  padding: 10,
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
                <ThemedText style={{ color: "#4aa1ff", fontSize: RFValue(14) }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
