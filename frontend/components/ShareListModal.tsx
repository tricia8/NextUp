import {
  Modal,
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";

interface User {
  // to add profile icon
  username: string;
}

const renderFlatlistItem = ({ item }: { item: User }) => {
  return (
    <View style={{ flexDirection: "row" }}>
      <FontAwesome name="user-circle" size={20} color="black" />

      <TouchableOpacity>
        <Text>{item.username}</Text>
      </TouchableOpacity>
    </View>
  );
};

type CustomModalProps = {
  data: User[];
  visible: boolean;
  onClose: () => void;
};

export default function ShareListModal({
  data,
  visible,
  onClose,
}: CustomModalProps) {
  const [username, setUsername] = useState("");
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContent}>
        <View style={styles.card}>
          <Text>Share List</Text>
          <TextInput
            placeholder="Add people"
            value={username}
            onChangeText={setUsername}
            enterKeyHint="search"
          ></TextInput>
          <Text>People with access</Text>
          <FlatList
            data={data}
            renderItem={renderFlatlistItem}
            keyExtractor={(item) => item.username}
          />
          <View>
            <TouchableOpacity style={[styles.button, {}]} onPress={onClose}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    width: "90%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 3,
  },
  button: {
    alignItems: "flex-end",
    borderRadius: 8,
    width: "50%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});
