import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { vs } from "react-native-size-matters";
import { useContext, useEffect, useState } from "react";
import UserSearch from "@/components/UserSearch";
import { User } from "@/types/user";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import LoadingScreen from "@/components/Loading";
import { addFriend, getAllUsers, getFriends } from "@/firebase/firestore";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.uid;

  const fetchData = async () => {
    try {
      setLoadingUsers(true);
      const [users, friends] = await Promise.all([
        getAllUsers(),
        getFriends(currentUserId),
      ]);
      setUsers(users);
      const friendUids = friends.map((friend) => friend.uid);
      setFriendUids(friendUids);
    } catch (err) {
      console.error("Error fetching users or friends:", err);
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
        await addFriend(currentUserId, friendId);
        Alert.alert("Success", "Friend added!");
        fetchData();
      } catch (error) {
        console.log("Error adding friend");
        Alert.alert("Error", "Error adding friend.");
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
})