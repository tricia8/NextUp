import React, { useState } from 'react';
import { Image, StyleSheet, ScrollView, View, Text,TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import JourneyScreen from '../journey';
import EditProfile from '@/components/editprofile';
import { User } from '@/types/user';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';


const PROFILEPICSIZE = ms(80);

export default function ProfileScreen() {

  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<User | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [completedEvents, setCompletedEvents] = useState(0);

  const finalUid = typeof uid === 'string' ? uid : Array.isArray(uid) ? uid[0] : auth.currentUser?.uid;

  useFocusEffect(
    useCallback(() => {
        if (!finalUid) return;

        const unsubscribe = onSnapshot(doc(db, 'users', finalUid), (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data() as User);
          }
        });

        return () => unsubscribe();
    }, [finalUid])
  );
    

  useFocusEffect(
    useCallback(() => {
      if (!finalUid) return;

      const unsubscribe = onSnapshot(doc(db, 'users', finalUid, 'bucketList', 'stats'), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setTotalEvents(data.totalEvents);
          setCompletedEvents(data.completedEvents);
        }
      });

      return () => unsubscribe();
    }, [finalUid])
  )

  if (!userData) {
    <ActivityIndicator size="large"/>
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>

            <View style={styles.profileContainer}>
                {userData?.photoUrl ? (
                  <Image
                    source={{ uri: userData.photoUrl }}
                    style={styles.profilePic}
                  />
                ) : (
                  <FontAwesome name="user-circle-o" size={PROFILEPICSIZE} color="#7b68ee" />
                )}


                <View style={styles.profileDetails}>
                    <View style={styles.username}>
                        <ThemedText 
                          type="subtitle" 
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={{ maxWidth: s(120) }}>
                          {userData?.username}
                        </ThemedText>
                        
                        {finalUid === auth.currentUser?.uid &&
                          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                              <Text style={styles.buttonText}>Edit Profile</Text>
                          </TouchableOpacity>
                        }
                    </View>

                    <View>
                        <ThemedText 
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{fontSize: RFValue(12), lineHeight: vs(20)}}>
                            {userData?.bio}                        
                        </ThemedText>
                    </View>
                </View>  

            </View>



            <View style={styles.statsContainer}>
                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>{totalEvents}</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>GOALS{'\n'}CREATED</Text>
                    </ThemedText>
                </View>

                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>{completedEvents}</ThemedText>{'\n'} 
                        <Text style={styles.subDataText}>GOALS{'\n'}COMPLETED</Text>
                    </ThemedText>
                </View>

                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>Travel</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>TOP{'\n'}CATEGORY</Text>
                    </ThemedText>
                </View>
            </View>


            <View style={styles.friendsContainer}>
              <TouchableOpacity style={styles.button} onPress={() => router.push('/friends')}>
                <Ionicons name='people-outline' color='white' size={ms(18)}/>
                <Text style={styles.buttonText}>View Friends</Text>
              </TouchableOpacity>

              {finalUid === auth.currentUser?.uid &&
                <TouchableOpacity style={styles.button} onPress={() => router.push('/addfriends')}>
                  <MaterialIcons name='group-add' color='white' size={ms(18)}/>
                </TouchableOpacity>
              }
            </View>


            <View style={{flex: 1}}>
              <View style={styles.previewContainer}>
                <Preview route='journey' title='Journey' color='rgba(26, 230, 186, 0.5)' component={<JourneyScreen />}/>
              </View>
            </View>

        </ThemedView>
      </ScrollView>

      {userData && (
        <EditProfile 
          visible={isModalVisible} 
          onClose={() => setModalVisible(false)} 
          userData={userData}
        />
        )
      }

    </SafeAreaView>
  )
}

function Preview(
      { route, title, color, component}: 
      { route: string, title: string, color: string, component: React.ReactNode} ) {
      
        return (
        <TouchableOpacity 
          onPress={() => router.navigate(`./${route}`)}
        >
            <View style={{height: '100%', width: '100%'}}>
              <View style={{ padding: 15 }}>
                <ThemedText type="subtitle" style={{textAlign: 'center'}}>{title}</ThemedText>
              </View>
              {component}
            </View>
            <LinearGradient 
              colors={['#00000000', color]} 
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none">
            </LinearGradient>
        </TouchableOpacity> 
)}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(16),
  },
  profileContainer: {
    paddingHorizontal: s(22),
    paddingTop: vs(35),
    flexDirection: 'row',
    gap: s(14),
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: vs(8),
  },
  profilePic: {
    height: PROFILEPICSIZE,
    width: PROFILEPICSIZE,
    borderRadius: PROFILEPICSIZE / 2,
  },
  username: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: 10,
    backgroundColor: '#7b68ee',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: s(22),
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  dataText: {
    textAlign: 'center',
    lineHeight: s(32),
  },
  subDataText: {
    fontSize: RFValue(12),
    lineHeight: s(20),
  },
  friendsContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: s(8),
  },
  buttonText: {
    fontSize: RFValue(12),
    color: 'white',
  },
  previewContainer: {
    height: '50%',
    overflow: 'hidden',
  }
});