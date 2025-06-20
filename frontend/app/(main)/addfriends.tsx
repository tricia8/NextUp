import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { vs } from 'react-native-size-matters';
import { useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from "@/firebase/firebaseConfig";
import UserSearch from '@/components/UserSearch';
import { User } from '@/types/user';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';



let data: User[];

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.uid;

  useFocusEffect(
    useCallback(() => {
        if (!currentUserId) {
          return;
        }

        const unsubscribe = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            data = snapshot.docs.map(doc => ({
              uid: doc.id,
              ...(doc.data() as Omit<User, 'uid'>)
            }));
            setUsers(data);
          }
        );

      return () => unsubscribe();
    }, [currentUserId])
  );

  if (!currentUserId) {
      return <ActivityIndicator size="large" />;
  }

  return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <ThemedView style={styles.mainContainer}>
                <UserSearch users={users} showAddButton={true} placeholder='Seach users' userId={currentUserId}/>
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