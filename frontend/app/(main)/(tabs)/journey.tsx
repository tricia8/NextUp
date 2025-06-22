import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { LegendList } from "@legendapp/list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { db } from "@/firebase/firebaseConfig";
import LoadingScreen from "@/components/Loading";
import { Event } from "@/types/event";
import { getFilteredSubBucketLists, getAllEvents, getRelationship } from "@/firebase/firestore";

type SubBucketList = {
  id: string;
  title: string;
  description: string;
  accessLevel: string;
  collaborators: string[];
  createdAt: string;
};

export default function JourneyScreen() {
  const { user } = useContext(AuthContext);
  const { uid: paramUid } = useLocalSearchParams();
  const [relationship, setRelationship] = useState<"self" | "friend" | "none">(
    "none"
  );
  const [subBucketLists, setSubBucketLists] = useState<SubBucketList[]>([]);
  const [events, setEvents] = useState<Event[] | null>(null);

  const finalParamUid = Array.isArray(paramUid) ? paramUid[0] : paramUid;

  //Use param uid if viewing a friend's journey,
  //otherwise use account user's uid from auth context
  const uid = finalParamUid || user?.uid;

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = getRelationship(
        db,
        user?.uid,
        uid,
        setRelationship
      );
      return () => unsubscribe();
    }, [user?.uid, uid])
  );


  useEffect(() => {
    if (!uid || !relationship) {
      setSubBucketLists([]);
      return;
    }

    const accessLevels =
      relationship === "self"
        ? ["private", "friends", "everyone"]
        : relationship === "friend"
        ? ["friends", "everyone"]
        : ["everyone"];

    const unsubscribe = getFilteredSubBucketLists(db, uid, accessLevels, setSubBucketLists);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid, relationship]);

  useEffect(() => {
    if (subBucketLists.length > 0 && uid) {
      getAllEvents();
    } else {
      setEvents([]);
    }
  }, [subBucketLists, uid]);

  function renderItem({ item }: { item: Event }) {
    return (
      <View
        style={{
          alignItems: Number(item.id) % 2 === 0 ? "flex-start" : "flex-end",
        }}
      >
        <TouchableOpacity style={styles.itemContainer}>
          <MaterialCommunityIcons
            name="flag-variant"
            size={ms(30)}
            color="#66cdaa"
          />
          <ThemedText
            style={styles.itemText}
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {item.title}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!uid || !events) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>
          {events.length === 0 ? (
            <View style={{alignItems: 'center'}}>
              <ThemedText>No completed goals.</ThemedText>
            </View>
          ) : (
            <LegendList
              data={events}
              renderItem={renderItem}
              keyExtractor={(item: Event) => item.id.toString()}
              recycleItems={true}
              maintainVisibleContentPosition
            />
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: s(15),
    paddingTop: vs(20),
  },
  itemContainer: {
    maxWidth: s(150),
    flexDirection: "row",
  },
  itemText: {
    fontSize: RFValue(14),
    flexShrink: 1,
    flexWrap: "wrap",
  },
});
