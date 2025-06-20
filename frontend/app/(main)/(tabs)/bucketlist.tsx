import { ThemedText } from "@/components/ThemedText";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ColorSchemeName,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { RFValue } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

export default function BucketList() {
  const [search, setSearch] = useState("");
  const colorScheme = useColorScheme(); // 'light' or 'dark'

  interface Sublist {
    title: string;
    completionStatus: number[];
    isShared: boolean;
  }

  // dummy data
  const DATA: Sublist[] = [
    {
      // icon: ,
      title: "New Zealand Road Trip",
      completionStatus: [1, 3],
      isShared: true,
    },
    {
      // icon: ,
      title: "Skills to learn",
      completionStatus: [1, 3],
      isShared: false,
    },
    {
      title: "Random Stuff",
      completionStatus: [3, 4],
      isShared: false,
    },
    {
      title: "Family Goals",
      completionStatus: [0, 5],
      isShared: true,
    },
    {
      title: "Hackathons",
      completionStatus: [1, 4],
      isShared: false,
    },
  ];

  const router = useRouter();

  const renderFlatlistItem = ({ item }: { item: Sublist }) => {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#0f2027", "#188991"]
            : ["#dcf4a9", "#b2df75"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.itemContainer}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push("/(main)/current-sublist")}
        >
          {item.isShared ? (
            <View>
              <Feather
                name="users"
                size={24}
                color={colorScheme === "dark" ? "white" : "black"}
              />
            </View>
          ) : (
            <View></View>
          )}
          <View style={styles.SubListRow2}>
            <ThemedText type="subtitle" style={styles.ListName}>
              {item.title}
            </ThemedText>
            <AntDesign
              name="right"
              size={20}
              color="black"
              style={{ marginTop: 6 }}
            />
          </View>
          <View>
            <ThemedText style={styles.StatusText}>
              {item.completionStatus[0]} of {item.completionStatus[1]} complete
            </ThemedText>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  const styles = getStyles(colorScheme);

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
          <FlashList
            data={DATA}
            renderItem={renderFlatlistItem}
            estimatedItemSize={20}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyExtractor={(item, index) => `${item.title}-${index}`}
          />
        </View>

        <View style={{ flex: 0.2 }}>
          <TouchableOpacity
            onPress={() => router.push("../new-sublist")}
            activeOpacity={0.8}
            style={styles.AddButton}
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
    itemContainer: {
      flexDirection: "column",
      marginVertical: 8,
      marginHorizontal: 15,
      padding: 20,
      justifyContent: "space-between",
      borderRadius: 5,
      elevation: 5,
    },
    SubListRow2: {
      flexDirection: "row",
      padding: 2,
      justifyContent: "space-between",
    },
    ListName: {
      fontSize: RFValue(16),
    },
    StatusText: {
      fontSize: RFValue(11),
    },
    searchFilterBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 10,
      marginVertical: 10,
      marginHorizontal: 10,
    },
    AddButton: {
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
