import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SearchBar } from "react-native-elements";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function BucketList() {
  const [search, setSearch] = useState("");

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
        <View style={{ flexDirection: "row" }}>
          <ThemedText type="subtitle">{item.title}</ThemedText>
          <AntDesign name="right" size={20} color="black" />
        </View>
        <View>
          <ThemedText>
            {item.completionStatus[0]} of {item.completionStatus[1]} complete
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
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

        <TouchableOpacity>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  ItemContainer: {
    flexDirection: "column",
    margin: 10,
    padding: 25,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#69d8ff",
  },
  AddButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "white",
    padding: 2,
  },
});
