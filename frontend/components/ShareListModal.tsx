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
import { RFValue } from "react-native-responsive-fontsize";

interface User {
  // to add profile icon
  username: string;
}

const renderFlatlistItem = ({ item }: { item: User }) => {
  return (
    <View style={styles.profile}>
      <FontAwesome name="user-circle" size={20} color="black" />

      <TouchableOpacity>
        <Text style={{ fontSize: RFValue(12) }}>{item.username}</Text>
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContent}>
        <View style={styles.card}>
          <Text style={{ fontSize: RFValue(16), fontWeight: "bold" }}>
            Share List
          </Text>
          <TextInput
            placeholder="Add people"
            value={username}
            onChangeText={setUsername}
            enterKeyHint="search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[styles.textInput, isFocused && styles.inputWrapperFocused]}
          />
          <Text style={styles.withAcessText}>People with access</Text>
          <FlatList
            data={data}
            renderItem={renderFlatlistItem}
            keyExtractor={(item) => item.username}
          />
          <View style={{ alignItems: "flex-end" }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onClose();
                setIsFocused(false);
              }}
            >
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
    gap: 8,
  },
  button: {
    alignItems: "center",
    borderRadius: 20,
    width: "40%",
    backgroundColor: "#c6e1dc",
    padding: 8,
  },
  withAcessText: {
    fontWeight: "bold",
    fontSize: RFValue(13),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  inputWrapperFocused: {
    borderColor: "#03acc1", // Highlight color when focused
  },
  profile: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});
