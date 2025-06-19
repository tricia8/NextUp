import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { vs } from 'react-native-size-matters';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from "@/firebase/firebaseConfig";
import UserSearch from '@/components/UserSearch';
import { User } from '@/types/user';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';


let data: User[];

export default function FriendsList() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        return;
      }

      const unsubscribe = onSnapshot(
        collection(db, "users", currentUserId, "friends"),
        (snapshot) => {
          data = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...(doc.data() as Omit<User, 'uid'>)
          }));
        }
      );

      return () => unsubscribe();
  }, [currentUserId])
);

  return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <ThemedView style={styles.mainContainer}>
                <UserSearch users={data} placeholder='Search friends' userId={currentUserId}/>
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