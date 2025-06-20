import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LegendList } from '@legendapp/list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';


type MileStone = {
    id: number;
    date: string;
    title: string;
    description: string;
}

export default function JourneyScreen() {
    const { user } = useContext(AuthContext);
    const { uid: paramUid } = useLocalSearchParams();
    const [relationship, setRelationship] = useState<'self' | 'friend' | 'none'>('none');

    const finalParamUid = Array.isArray(paramUid) ? paramUid[0] : paramUid;

    //Use param uid if viewing a friend's journey,
    //otherwise use account user's uid from auth context
    const uid = finalParamUid || user?.uid;

    useFocusEffect(
        useCallback(() => {
            if (!uid || !user?.uid) {
                return;
            }

            if (uid === user.uid) {
                setRelationship('self');
                return;
            }
            
            const docRef = doc(db, "users", user.uid, "friends", uid);

            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setRelationship('friend');
                } else {
                    setRelationship('none');
                }
            });
            
            return () => unsubscribe();
        }, [user?.uid, uid])
    );

    function renderItem({ item }: { item: MileStone }) {

        return (
            <View style={{
                alignItems: item.id % 2 === 0 ? 'flex-start' : 'flex-end',
            }}>
                <TouchableOpacity style={styles.itemContainer}>
                    <MaterialCommunityIcons name="flag-variant" size={ms(30)} color="#66cdaa" />
                    <ThemedText style={styles.itemText}>{item.title}</ThemedText>
                </TouchableOpacity>
            </View>
        )
    }
    
    if (!uid) {
        return (
            <ActivityIndicator size='large'/>
        )
    }

    return (
        <SafeAreaView edges={[]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <ThemedView style={styles.mainContainer}>
                    <LegendList
                        data={}
                        renderItem={renderItem}
                        keyExtractor={(item: MileStone) => item.id.toString()}
                        recycleItems={true}
                        maintainVisibleContentPosition
                    />
                </ThemedView>
            </ScrollView>
        </SafeAreaView>        
    )
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingHorizontal: s(15),
        paddingTop: vs(20),
    },
    itemContainer: {
        maxWidth: s(150),
        flexDirection: 'row',
    },
    itemText: {
        fontSize: RFValue(14),
        flexShrink: 1, 
        flexWrap: 'wrap',
    },
});