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
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SearchBar } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";

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
      isShared: true,
    },
    {
      title: "Random Stuff",
      completionStatus: [3, 4],
      isShared: false,
    },
  ];

  const router = useRouter();

  const renderFlatlistItem = ({ item }: { item: Sublist }) => {
    return (
      <TouchableOpacity style={styles.ItemContainer}>
        {item.isShared ? (
          <View>
            <Feather name="users" size={24} color="black" />
          </View>
        ) : (
          <View></View>
        )}
        <View style={styles.SubListRow2}>
          <ThemedText type="subtitle">{item.title}</ThemedText>
          <AntDesign
            name="right"
            size={20}
            color="black"
            style={{ marginTop: 6 }}
          />
        </View>
        <View>
          <ThemedText>
            {item.completionStatus[0]} of {item.completionStatus[1]} complete
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.SafeView}>
      <ThemedView>
        <ThemedText type="title" style={styles.Heading}>
          My Bucket List
        </ThemedText>
      </ThemedView>
      <View style={styles.SearchFilterBar}>
        <SearchBar
          containerStyle={{
            flex: 1,
            backgroundColor: "transparent",
          }}
          platform="default"
          placeholder="Search Item..."
          onChangeText={setSearch}
          value={search}
          round
        />

        <TouchableOpacity style={{ justifyContent: "center" }}>
          <Ionicons
            size={35}
            name="filter-circle-outline"
            color={"yellowgreen"}
          />
        </TouchableOpacity>
      </View>

      <FlashList
        data={DATA}
        renderItem={renderFlatlistItem}
        estimatedItemSize={20}
      />

      <TouchableOpacity
        onPress={() => router.push("../newgoal")}
        activeOpacity={0.8}
        style={styles.AddButton}
      >
        <Ionicons name="add-circle" size={70} color="coral" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    SafeView: {
      flex: 1,
      margin: 6,
    },
    Heading: {
      margin: 8,
    },
    ItemContainer: {
      flexDirection: "column",
      margin: 10,
      padding: 25,
      justifyContent: "space-between",
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "white",
      backgroundColor: colorScheme === "dark" ? "#1a98a1" : "#6ae7f0",
    },
    SubListRow2: {
      flexDirection: "row",
      padding: 2,
      justifyContent: "space-between",
    },
    SearchFilterBar: {
      flexDirection: "row",
      justifyContent: "center",
    },
    AddButton: {
      position: "absolute",
      bottom: 20,
      right: 20,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: "coral",
      padding: 2,
    },
  });
