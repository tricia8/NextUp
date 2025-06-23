import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { vs } from 'react-native-size-matters';
import { useContext, useState } from 'react';
import UserSearch from '@/components/UserSearch';
import { User } from '@/types/user';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/Loading';
import { getFriends } from '@/firebase/firestore';



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

      const unsubscribe = getFriends(currentUserId, setFriends);

      return () => unsubscribe();
    }, [currentUserId])
  );

  
  if (!currentUserId) {
    return <LoadingScreen />;
  }

  return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <ThemedView style={styles.mainContainer}>
                <UserSearch users={friends} placeholder='Search friends'/>
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