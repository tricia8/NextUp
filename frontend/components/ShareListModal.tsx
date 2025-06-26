import {
  Modal,
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Pressable,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { User } from "@/types/user";
import { ms } from "react-native-size-matters";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

const PROFILEPICSIZE = ms(38);

type CustomModalProps = {
  currentUid: string;
  data: User[];
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  onClose: () => void;
};

export default function ShareListModal({
  currentUid,
  data,
  visible,
  setModalVisible,
  onClose,
}: CustomModalProps) {
  console.log("Modal data:", data);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const renderFlatlistItem = ({ item }: { item: User }) => {
    return (
      <View style={styles.profile}>
        {item.photoUrl ? (
          <Image
            style={styles.profilePic}
            source={{ uri: item.photoUrl }}
            contentFit="cover"
            transition={500}
          />
        ) : (
          <FontAwesome name="user-circle" size={PROFILEPICSIZE} color="black" />
        )}

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(main)/(tabs)/profile/[uid]",
              params: { uid: item.uid },
            })
          }
        >
          <Text key={item.uid} style={{ fontSize: RFValue(12) }}>
            {item.username} {item.uid == currentUid ? "(you)" : ""}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, zIndex: 300 }}>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalContent}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.card}>
            <Text style={{ fontSize: RFValue(16), fontWeight: "bold" }}>
              Share This List
            </Text>
            <TextInput
              placeholder="Add people..."
              value={username}
              onChangeText={setUsername}
              enterKeyHint="search"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={[
                styles.textInput,
                isFocused && styles.inputWrapperFocused,
              ]}
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
        </Pressable>
      </Modal>
    </SafeAreaView>
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
  profilePic: {
    height: PROFILEPICSIZE,
    width: PROFILEPICSIZE,
    borderRadius: PROFILEPICSIZE / 2,
  },
});
