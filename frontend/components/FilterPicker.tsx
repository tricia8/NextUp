import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import FilterChip from "./FilterChip";
import { RFValue } from "react-native-responsive-fontsize";
import { filterSublistsAdvanced } from "@/utils/sublists";
import { Sublist } from "@/types/sublist";
import { auth } from "@/firebase/firebaseConfig";
import { FilterOptions } from "@/types/filterOptions";

type FilterPickerProps = {
  sublistData: Sublist[]; // pass in filtered sublists
  closeSheet: () => void;
  setFilteredSublists: React.Dispatch<React.SetStateAction<Sublist[]>>;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  setSearchResults: React.Dispatch<React.SetStateAction<Sublist[]>>;
};

export default function FilterPicker({
  sublistData,
  closeSheet,
  setFilteredSublists,
  filterOptions,
  setFilterOptions,
  setSearchResults,
}: FilterPickerProps) {
  // Filters
  /* const [owned, setOwned] = useState<boolean | undefined>(undefined);
  const [shared, setShared] = useState<boolean | undefined>(undefined);
  const [visibility, setVisibility] = useState<
    "private" | "friends" | "everyone" | undefined
  >(undefined);
  const [progressStatus, setProgressStatus] = useState<
    "Completed" | "In Progress" | "Getting Started" | undefined
  >(undefined); */

  const { owned, shared, visibility, progressStatus } = filterOptions;

  const uid = auth.currentUser?.uid;

  const submitFilters = () => {
    if (!uid) {
      console.error("User ID is not available");
      return;
    }
    closeSheet();
    const results = filterSublistsAdvanced(uid, sublistData, {
      owned,
      shared,
      visibility,
      progressStatus,
    });

    setFilteredSublists(results); // update base filtered list for search bar to work on
    setSearchResults(results); // reset search too
  };

  const resetAllFilters = () => {
    setFilterOptions({
      owned: undefined,
      shared: undefined,
      visibility: undefined,
      progressStatus: undefined,
    });
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ThemedText type="subtitle">Filter Options</ThemedText>
        <TouchableOpacity onPress={resetAllFilters}>
          <ThemedText style={styles.clearText}>Reset All</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsContainer}>
        <ThemedText style={styles.infoText}>Who owns it</ThemedText>
        <View style={styles.innerContainer}>
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            <FilterChip
              onPress={() => {
                setFilterOptions((prev) => ({ ...prev, owned: true }));
              }}
              selected={owned === true}
              label="Me"
            />
            <FilterChip
              onPress={() =>
                setFilterOptions((prev) => ({ ...prev, owned: false }))
              }
              selected={owned === false}
              label="Not Me"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilterOptions((prev) => ({ ...prev, owned: undefined }));
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chipsContainer}>
        <ThemedText style={styles.infoText}>Sharing status</ThemedText>

        <View style={styles.innerContainer}>
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            <FilterChip
              onPress={() =>
                setFilterOptions((prev) => ({ ...prev, shared: true }))
              }
              selected={shared === true}
              label="Shared"
            />
            <FilterChip
              onPress={() =>
                setFilterOptions((prev) => ({ ...prev, shared: false }))
              }
              selected={shared === false}
              label="Not Shared"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilterOptions((prev) => ({ ...prev, shared: undefined }));
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chipsContainer}>
        <View style={styles.innerContainer}>
          <ThemedText style={styles.infoText}>Who can see it</ThemedText>
          <TouchableOpacity
            onPress={() => {
              setFilterOptions((prev) => ({ ...prev, visibility: undefined }));
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, visibility: "private" }))
            }
            selected={visibility === "private"}
            label="Only Me"
          />
          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, visibility: "friends" }))
            }
            selected={visibility === "friends"}
            label="Friends"
          />

          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, visibility: "everyone" }))
            }
            selected={visibility === "everyone"}
            label="Everyone"
          />
        </View>
      </View>

      <View style={styles.chipsContainer}>
        <View style={styles.innerContainer}>
          <ThemedText style={styles.infoText}>Progress status</ThemedText>
          <TouchableOpacity
            onPress={() => {
              setFilterOptions((prev) => ({
                ...prev,
                progressStatus: undefined,
              }));
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({
                ...prev,
                progressStatus: "Completed",
              }))
            }
            selected={progressStatus === "Completed"}
            label="Completed"
          />
          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({
                ...prev,
                progressStatus: "In Progress",
              }))
            }
            selected={progressStatus === "In Progress"}
            label="In Progress"
          />
          <FilterChip
            onPress={() =>
              setFilterOptions((prev) => ({
                ...prev,
                progressStatus: "Getting Started",
              }))
            }
            selected={progressStatus === "Getting Started"}
            label="Getting Started"
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <TouchableOpacity onPress={closeSheet} style={styles.clearButton}>
          <ThemedText>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={submitFilters} style={styles.submitButton}>
          <Text style={{ color: "white" }}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: "column",
    gap: 8,
    justifyContent: "center",
  },
  clearText: {
    fontSize: RFValue(11.5),
  },
  infoText: {
    fontStyle: "italic",
    fontSize: RFValue(11.7),
  },
  submitButton: {
    borderRadius: 7,
    backgroundColor: "#995bd8ff",
    // borderWidth: 1,
    padding: 8,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    borderRadius: 7,
    borderColor: "#ff6347f1",
    borderWidth: 1,
    padding: 8,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 1,
    width: "100%",
    flexWrap: "nowrap",
    gap: 10,
  },
});
