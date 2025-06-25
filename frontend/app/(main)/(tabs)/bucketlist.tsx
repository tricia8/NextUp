import { ThemedText } from "@/components/ThemedText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ColorSchemeName,
  Modal,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { RFValue } from "react-native-responsive-fontsize";
import { AuthContext } from "@/context/AuthContext";
import {
  deleteSubBucketList,
  getAllSubBucketLists,
} from "@/firebase/firestore";
import { Sublist } from "@/types/sublist";
import LoadingScreen from "@/components/Loading";
import { showMessage } from "react-native-flash-message";
import SublistItems from "@/components/SublistItems";

export default function BucketList() {
  const { user, loading } = useContext(AuthContext);

  const uid = user?.uid;
  const [sublists, setSublists] = useState<Sublist[]>([]);
  const [search, setSearch] = useState("");
  const colorScheme = useColorScheme(); // 'light' or 'dark'

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const fetchSubBucketLists = async () => {
        try {
          const sublists = (await getAllSubBucketLists(uid)) as Sublist[];
          setSublists(sublists);
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
    }, [uid, sublists])
  );

  const router = useRouter();

  const styles = getStyles(colorScheme);

  if (loading || !user?.uid) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <View style={styles.searchFilterBar}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Search list..."
              style={{
                color: colorScheme === "dark" ? "#e3e3e3" : "black",
                borderRadius: 10,
                padding: 15,
                fontSize: RFValue(13),
              }}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={
                colorScheme === "light" ? "#727573" : "white"
              }
              inputMode="search"
              returnKeyLabel="search"
              underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colorScheme === "dark" ? "#34403e" : "#999"}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={{ justifyContent: "center" }}>
            <Ionicons
              size={35}
              name="filter-circle-outline"
              color={colorScheme === "dark" ? "yellowgreen" : "#36a76b"}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 0.8 }}>
          <SublistItems
            uid={uid}
            data={sublists}
            updateData={setSublists}
            colorScheme={colorScheme}
          />
        </View>

        <View style={{ flex: 0.2 }}>
          <TouchableOpacity
            onPress={() => router.push("../new-sublist")}
            activeOpacity={0.8}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={75} color="#39a64b" />
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
      // borderWidth: 1,
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
    clearButton: {
      paddingLeft: 3,
    },
  });
