import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { s, vs } from "react-native-size-matters";
import { Sublist } from "@/types/sublist";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  sublists: Sublist[];
  filteredSublists: Sublist[];
  setFilteredSublists: React.Dispatch<React.SetStateAction<Sublist[]>>;
  placeholder?: string;
};

export default function SublistSearchBar({
  sublists,
  filteredSublists,
  setFilteredSublists,
  placeholder = "Search sublists...",
}: Props) {
  const [search, setSearch] = useState<string>("");
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  /* useEffect(() => {
    setFilteredSublists(sublists);
  }, [sublists]); */

  const filterData = (text: string) => {
    console.log("Filtering data with text:", text);
    const formattedQuery = text.toLowerCase();
    const filtered = sublists.filter((item) =>
      item.title.toLowerCase().includes(formattedQuery)
    );
    setFilteredSublists(filtered);
    console.log("filteredSublists", filteredSublists);
    setSearch(text);
  };

  const resetText = () => {
    setSearch("");
    setFilteredSublists(sublists);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={placeholder}
          style={styles.input}
          value={search}
          onChangeText={filterData}
          placeholderTextColor={colorScheme === "light" ? "#727573" : "white"}
          inputMode="search"
          returnKeyLabel="search"
          underlineColorAndroid="transparent"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={resetText} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={RFValue(24)}
              color={colorScheme === "dark" ? "#34403e" : "#999"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: any) =>
  StyleSheet.create({
    searchContainer: {
      paddingHorizontal: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 20,
      backgroundColor:
        colorScheme === "dark"
          ? "rgba(221, 252, 189, 0.65)" /* "#4b8e83" */
          : "#d7e6de",
    },
    input: {
      color: "black",
      borderRadius: 10,
      padding: 15,
      fontSize: RFValue(13),
      paddingHorizontal: s(10),
      flex: 1,
    },
    clearButton: {
      paddingLeft: 3,
    },
  });
