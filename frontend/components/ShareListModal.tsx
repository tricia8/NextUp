import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Modal from "react-native-modal";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { use, useState } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { User } from "@/types/user";
import { ms } from "react-native-size-matters";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import UserSearchPicker from "./UserSearchPicker";

const PROFILEPICSIZE = ms(38);

type CustomModalProps = {
  currentUid: string;
  allUsers: User[];
  collaborators: User[]; // collaborators array
  setCollaborators: React.Dispatch<React.SetStateAction<User[]>>;
  sharedUids: string[]; // array of user IDs
  setSharedUids: React.Dispatch<React.SetStateAction<string[]>>;
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  onClose: () => void;
};

export default function ShareListModal({
  currentUid,
  allUsers,
  collaborators,
  setCollaborators,
  sharedUids,
  setSharedUids,
  visible,
  setModalVisible,
  onClose,
}: CustomModalProps) {
  console.log("Modal collaborators:", collaborators);
  const router = useRouter();
  const colorScheme = useColorScheme();

  // const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  const renderFlatlistItem = ({ item }: { item: User }) => {
    // render all collaborators
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
              pathname: "/(main)/profile/[uid]",
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
    <Modal
      isVisible={visible}
      animationIn={"fadeIn"}
      animationOut={"fadeOut"}
      avoidKeyboard
      onBackButtonPress={() => setModalVisible(false)}
      onBackdropPress={() => setModalVisible(false)}
    >
      <View style={styles.modalContent}>
        <View style={styles.card}>
          <Text style={styles.listShareText}>Share This List</Text>
          {/* <TextInput
            placeholder="Add people..."
            value={username}
            onChangeText={setUsername}
            enterKeyHint="search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[styles.textInput, isFocused && styles.inputWrapperFocused]}
          /> */}
          {/* <UserSearch
            users={allUsers}
            placeholder="Add people..."
            userId={currentUid}
            sharedUids={sharedUids}
            handleAddUser={(user) => {
              setCollaborators((prev) => [...prev, user]);
              setSharedUids((prev) => [...prev, user.uid]);
            }}
          /> */}

          <UserSearchPicker
            colorScheme={colorScheme}
            allUsers={allUsers}
            invitedUsers={invitedUsers}
            setInvitedUsers={setInvitedUsers}
            collaboratorUids={sharedUids}
          />

          <Text style={styles.withAcessText}>People with access</Text>
          <FlatList
            data={collaborators}
            renderItem={renderFlatlistItem}
            keyExtractor={(item) => item.username}
            style={{ flexGrow: 1, width: "100%" }}
            contentContainerStyle={{ paddingBottom: 10 }}
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
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    width: "90%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 3,
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    borderRadius: 20,
    width: "40%",
    backgroundColor: "#c6e1dc",
    padding: 8,
  },
  listShareText: {
    fontSize: RFValue(16),
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  withAcessText: {
    fontWeight: "bold",
    fontSize: RFValue(13),
    alignSelf: "flex-start",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    marginBottom: 12,
    alignSelf: "stretch",
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
