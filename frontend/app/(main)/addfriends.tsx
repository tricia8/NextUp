import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { vs } from 'react-native-size-matters';
import { useContext, useEffect, useState } from 'react';
import UserSearch from '@/components/UserSearch';
import { User } from '@/types/user';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/Loading';
import { getAllUsers, getFriends } from '@/firebase/firestore';



export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.uid;

  useFocusEffect(
    useCallback(() => {
        if (!currentUserId) {
          return;
        }

        const fetchData = async () => {
          try {
            const [users, friendUids] = await Promise.all([
              getAllUsers(),
              getFriends(currentUserId),
            ]);
            setUsers(users);
            setFriendUids(friendUids);
          } catch (err) {
            console.error("Error fetching users or friends:", err);
          }
        };

        fetchData();
    }, [currentUserId])
  );

  if (!currentUserId) {
      return <LoadingScreen />;
  }

  return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <ThemedView style={styles.mainContainer}>
                <UserSearch 
                  users={users} 
                  showAddButton={true} 
                  placeholder='Seach users' 
                  userId={currentUserId} 
                  friendUids={friendUids}
                />
              </ThemedView>
          </ScrollView>
      </SafeAreaView>
  )
}






const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(14),
  },
})