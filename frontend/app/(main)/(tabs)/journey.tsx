import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { LegendList } from "@legendapp/list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import LoadingScreen from "@/components/Loading";
import { Event } from "@/types/event";
import {
  getFilteredSubBucketLists,
  getAllEvents,
  getRelationship,
} from "@/firebase/firestore";

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
      if (!user?.uid || !uid) {
        setRelationship("none");
        setSubBucketLists([]);
        setEvents([]);
        return;
      }

      const fetchAll = async () => {
        try {
          // Fetch relationship
          const rel = await getRelationship(user.uid, uid);
          setRelationship(rel);

          const accessLevels =
            relationship === "self"
              ? ["private", "friends", "everyone"]
              : relationship === "friend"
              ? ["friends", "everyone"]
              : ["everyone"];

          // Fetch subbucketlists
          const subLists = await getFilteredSubBucketLists(uid, accessLevels);
          setSubBucketLists(subLists);

          // Fetch events
          if (subBucketLists.length > 0) {
            const events = await getAllEvents(uid, subLists);
            setEvents(events);
          } else {
            setEvents([]);
          }
        } catch (error) {
          console.error("Error fetching data", error);
        }
      };

      fetchAll();
    }, [user?.uid, uid])
  );

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
            <View style={{ alignItems: "center" }}>
              <ThemedText>No visible completed goals.</ThemedText>
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
