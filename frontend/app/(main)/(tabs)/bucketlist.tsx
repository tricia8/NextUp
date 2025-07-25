import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useMemo, useState } from "react";
import {
  ColorSchemeName,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { RFValue } from "react-native-responsive-fontsize";
import { AuthContext } from "@/context/AuthContext";
import {
  getAllSubBucketLists,
  getUnownedSubBucketLists,
  getOwnedSubBucketLists,
} from "@/firebase/firestore";
import { Sublist } from "@/types/sublist";
import LoadingScreen from "@/components/Loading";
import { showMessage } from "react-native-flash-message";
import SublistItems from "@/components/SublistItems";
import SublistSearchBar from "@/components/SublistSearchBar";
import { ThemedText } from "@/components/ThemedText";
import { useSublistStore } from "@/stores/sublistStore";
import { useShallow } from "zustand/react/shallow";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function BucketList() {
  const { user, loading } = useContext(AuthContext);

  const uid = user?.uid;
  //  const [sublists, setSublists] = useState<Sublist[]>([]);
  const [filteredSublists, setFilteredSublists] = useState<Sublist[]>([]);
  const [version, setVersion] = useState(false); // toggle to trigger refetch
  const [isLoading, setIsLoading] = useState(false); // loading state for sublists

  const colorScheme = useColorScheme(); // 'light' or 'dark'

  const { setSublists, updateCachedSublist, addSublist } = useSublistStore();
  const sublistRecord = useSublistStore(
    useShallow((state) => state.sublistData || ({} as Record<string, Sublist>))
  );

  const sublistOrder = useSublistStore(
    useShallow((state) => state.sublistOrder || [])
  );

  // Sublist array for flashlist
  const bucketList: Sublist[] = useMemo(() => {
    return sublistOrder?.map((id) => sublistRecord?.[id]) ?? [];
  }, [sublistRecord, sublistOrder]);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let isActive = true;
      let unsubUnownedSublists: (() => void) | undefined;
      let unsubOwnedSublists: (() => void) | undefined;

      const fetchSubBucketLists = async () => {
        try {
          const cachedSublistCollection =
            useSublistStore.getState().sublistData;

          if (!cachedSublistCollection) {
            // store doesn't have sublist collection yet
            setIsLoading(true);
            const sublists = (await getAllSubBucketLists()) as Sublist[];
            console.log("Fetched sub-bucket lists:", sublists);

            if (sublists.length === 0) {
              setIsLoading(false);
              return;
            }

            // build sublists record and order array
            const sublistRecord: Record<string, Sublist> = {};
            const sublistOrder: string[] = [];

            sublists.forEach((sublist: Sublist) => {
              sublistRecord[sublist.id] = {
                ...sublist,
              };
              sublistOrder.push(sublist.id);
            });

            if (isActive) {
              setSublists(sublistRecord, sublistOrder);
            }
            setIsLoading(false);
          }

          // 2 snapshot listeners for sublists
          const unownedSublistsRef = collection(
            db,
            "users",
            uid,
            "sharedSublists"
          );

          const q1 = query(unownedSublistsRef, orderBy("updatedAt", "desc"));

          unsubUnownedSublists = onSnapshot(q1, async (docSnap) => {
            if (!isActive) return; // prevent state update after unmount

            const unownedSublistsArray = await getUnownedSubBucketLists(); // sorted by updatedAt desc
            unownedSublistsArray.forEach((sublist: Sublist) => {
              if (sublist.id in sublistRecord) {
                // update existing sublist
                updateCachedSublist(sublist.id, sublist, sublist.ownerId);
              } else {
                // add new sublist, append to the front of sublistOrder
                addSublist(sublist.id, sublist, sublist.ownerId);
              }
              // re-sort sublistOrder by updatedAt to maintain order
            });
          });

          const ownedSublistsRef = collection(db, "users", uid, "bucketList");

          const q2 = query(ownedSublistsRef, orderBy("updatedAt", "desc"));
          unsubOwnedSublists = onSnapshot(q2, async (docSnap) => {
            if (!isActive) return; // prevent state update after unmount

            const ownedSublistsArray = await getOwnedSubBucketLists(); // sorted by updatedAt desc
            ownedSublistsArray.forEach((sublist: Sublist) => {
              if (sublist.id in sublistRecord) {
                // update existing sublist
                updateCachedSublist(sublist.id, sublist, sublist.ownerId);
              } else {
                // add new sublist, append to the front of sublistOrder
                addSublist(sublist.id, sublist, sublist.ownerId);
              }
              // re-sort sublistOrder by updatedAt to maintain order
            });
          });
        } catch (error) {
          console.error("Error fetching sub-bucket lists:", error);
          showMessage({
            message: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to fetch sublists",
            type: "danger",
            statusBarHeight: StatusBar.currentHeight,
            floating: true,
            icon: "danger",
            duration: 5000,
          });
        }
      };

      fetchSubBucketLists();

      // Do something when the screen is unfocused
      return () => {
        isActive = false; // Avoids setting state after unmount
        if (unsubUnownedSublists) unsubUnownedSublists();
        if (unsubOwnedSublists) unsubOwnedSublists();
      };
    }, [uid, version]) // `version` toggling triggers refetch
  );

  const router = useRouter();

  const styles = getStyles(colorScheme);

  if (loading || !user?.uid || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <View style={styles.searchFilterBar}>
          <SublistSearchBar
            setFilteredSublists={setFilteredSublists}
            filteredSublists={filteredSublists}
            // sublists={sublists}
            sublists={bucketList}
          />

          <TouchableOpacity style={{ justifyContent: "center" }}>
            <Ionicons
              size={35}
              name="filter-circle-outline"
              color={colorScheme === "dark" ? "yellowgreen" : "#36a76b"}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <LoadingScreen />
        ) : bucketList.length === 0 ? (
          <View style={styles.emptyListView}>
            <ThemedText style={styles.emptyListText}>
              Looks empty here...{"\n"}Add a sublist to get things rolling!
            </ThemedText>
          </View>
        ) : (
          <View style={{ flex: 0.8 }}>
            <SublistItems
              uid={uid}
              data={filteredSublists}
              updateData={setSublists}
              toggleVersion={() => setVersion(!version)}
              colorScheme={colorScheme}
            />
          </View>
        )}

        <View style={{ flex: 0.2 }}>
          <TouchableOpacity
            onPress={() => router.push("../new-sublist")}
            activeOpacity={0.5}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={80} color="#39a64b" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    safeView: {
      flex: 1,
    },
    themedView: {
      flex: 1,
    },
    searchFilterBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 10,
      marginVertical: 10,
      marginHorizontal: 10,
    },
    addButton: {
      position: "absolute",
      bottom: 20,
      right: 20,
      borderRadius: 50,
      borderColor: "coral",
      padding: 2,
    },
    inputContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: colorScheme === "dark" ? "#4b8e83" : "#d7e6de",
      flex: 1,
    },
    emptyListView: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyListText: {
      fontSize: RFValue(15),
      flexShrink: 1,
      lineHeight: RFValue(30),
    },
  });
