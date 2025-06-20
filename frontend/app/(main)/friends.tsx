import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { vs } from 'react-native-size-matters';
import { useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from "@/firebase/firebaseConfig";
import UserSearch from '@/components/UserSearch';
import { User } from '@/types/user';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';


let data: User[];

export default function FriendsList() {
  const [friends, setFriends] = useState<User[]>([]);
  const { viewedUid } = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const currentUserId = typeof viewedUid === 'string'
    ? viewedUid
    : Array.isArray(viewedUid)
      ? viewedUid[0]
      : user?.uid;
  
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
          setFriends(data);
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
                <UserSearch users={friends} placeholder='Search friends' userId={currentUserId}/>
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