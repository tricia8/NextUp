import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Modal from "react-native-modal";
import React, { useState } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { User } from "@/types/user";
import { useRouter } from "expo-router";
import UserSearchPicker from "./UserSearchPicker";
import ProfilePic from "./ProfilePic";

type CustomModalProps = {
  currentUid: string;
  ownerId: string;
  allUsers: User[];
  collaborators: User[]; // collaborators array
  setCollaborators: React.Dispatch<React.SetStateAction<User[]>>;
  sharedUids: string[]; // array of user IDs
  setSharedUids: React.Dispatch<React.SetStateAction<string[]>>;
  invitedUids: string[];
  setInvitedUids: React.Dispatch<React.SetStateAction<string[]>>;
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  onClose: () => void;
  onInviteUser?: (userId: string) => void;
  onRemoveCollaborator: (userId: string) => void;
};

export default function ShareListModal({
  currentUid,
  ownerId,
  allUsers,
  collaborators,
  setCollaborators,
  sharedUids,
  setSharedUids,
  invitedUids,
  setInvitedUids,
  visible,
  setModalVisible,
  onClose,
  onInviteUser,
  onRemoveCollaborator,
}: CustomModalProps) {
  console.log("Modal collaborators:", collaborators);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isOwner = currentUid === ownerId;

  // const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const hasInvitees = invitedUids.length > 0;

  // add invited users to collaborators and sharedUids
  const inviteUserIds = () => {
    setSharedUids((prev) => [...new Set([...prev, ...invitedUids])]);
    setCollaborators((prev) => [
      ...new Set([
        ...prev,
        ...allUsers.filter((user) => invitedUids.includes(user.uid)),
      ]),
    ]);
    console.log("Collaborators: ", collaborators);
    setInvitedUids([]); // clear invited users after inviting
  };

  const onInvitation = onInviteUser
    ? async () => {
        const uidsToInvite = [...invitedUids]; // copy before clearing
        await Promise.all(uidsToInvite.map((uid) => onInviteUser?.(uid))); // update db
        // inviteUserIds();
        setInvitedUids([]);
      }
    : () => inviteUserIds(); // only update UI

  const renderFlatlistItem = ({ item }: { item: User }) => {
    // render all collaborators
    return (
      <View style={styles.profile}>
        <ProfilePic imageUrl={item?.photoUrl} size={30} />

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(main)/profile/[uid]",
              params: { uid: item.uid },
            })
          }
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            flexShrink: 1,
          }}
        >
          <Text key={item.uid} style={{ fontSize: RFValue(12) }}>
            {item.username} {item.uid == currentUid ? "(you)" : ""}
          </Text>
          {item.uid === ownerId && <Text style={styles.owner}>Owner</Text>}

          {isOwner
            ? item.uid !== ownerId && (
                <TouchableOpacity
                  onPress={() => {
                    onRemoveCollaborator(item.uid);
                  }}
                  style={{
                    backgroundColor: "#f8d7da",
                    borderRadius: 10,
                    padding: 4,
                    marginTop: 4,
                  }}
                >
                  <Text>Remove</Text>
                </TouchableOpacity>
              )
            : item.uid === currentUid && (
                <TouchableOpacity
                  onPress={() => {
                    onRemoveCollaborator(item.uid);
                  }}
                  style={{
                    backgroundColor: "#f8d7da",
                    borderRadius: 10,
                    padding: 4,
                    marginTop: 4,
                  }}
                >
                  <Text>Remove</Text>
                </TouchableOpacity>
              )}
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

          {isOwner && (
            <View style={{ flexDirection: "row", flexShrink: 0.7, gap: 5 }}>
              <UserSearchPicker
                colorScheme={colorScheme}
                allUsers={allUsers}
                invitedUsers={invitedUids}
                setInvitedUsers={setInvitedUids}
                collaboratorUids={sharedUids}
              />

              <TouchableOpacity
                style={{
                  borderRadius: 15,
                  padding: 5,
                  backgroundColor: "#c6e1dc",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                disabled={!hasInvitees}
                onPress={onInvitation}
              >
                <Text>Invite</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.withAcessText}>People with access</Text>
          <FlatList
            data={collaborators}
            renderItem={renderFlatlistItem}
            keyExtractor={(item) => item.uid}
            style={{ flexGrow: 1, width: "100%" }}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
          <View style={{ alignItems: "flex-end" }}>
            <TouchableOpacity
              style={styles.closeButton}
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
  },
  card: {
    width: "95%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 3,
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    maxHeight: "46%",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 16,
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
    marginVertical: 4,
  },
  owner: {
    fontSize: RFValue(12),
    color: "#888",
    marginLeft: 5,
  },
});
