import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { vs } from "react-native-size-matters";
import { useContext, useState } from "react";
import UserSearch from "@/components/UserSearch";
import { User } from "@/types/user";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import LoadingScreen from "@/components/Loading";
import {
  createRequest,
  getRequestInfo,
  getAllUsers,
  getFriends,
  hasExistingRequest,
  getSentRequests,
} from "@/firebase/firestore";
import { Activity } from "@/types/activity";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [sentRequests, setSentRequests] = useState<Activity[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.uid;

  const fetchData = async () => {
    try {
      setLoadingUsers(true);

      const [users, friends, sentRequests] = await Promise.all([
        getAllUsers(),
        getFriends(currentUserId),
        getSentRequests(currentUserId),
      ]);

      setUsers(users);
      const friendUids = friends.map((friend) => friend.uid);
      setFriendUids(friendUids);
      setSentRequests(sentRequests);
    } catch (err) {
      console.error("Error fetching users, friends or pending requests:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        return;
      }

      fetchData();
    }, [currentUserId])
  );

  const handleAddFriend = async (friendId: string) => {
    try {
      const requestExists = await hasExistingRequest(currentUserId, friendId);
      if (requestExists) {
        Alert.alert(
          "Friend request pending",
          "You already have a pending request with this user."
        );
        return;
      }

      const requestId = await createRequest(currentUserId, friendId);
      const requestInfo = await getRequestInfo(requestId);
      const friendName = requestInfo.receiverName;
      Alert.alert(
        "Friend request sent!",
        `Sent friend request to ${friendName}.`
      );
    } catch (error) {
      console.log("Error sending friend request.");
      Alert.alert("Error", "Error sending friend request.");
    }
  };

  if (!currentUserId || loadingUsers) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>
          <UserSearch
            users={users}
            showAddButton={true}
            placeholder="Seach users"
            userId={currentUserId}
            friendUids={friendUids}
            handleAddFriend={handleAddFriend}
            sentRequests={sentRequests}
          />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(14),
  },
});
