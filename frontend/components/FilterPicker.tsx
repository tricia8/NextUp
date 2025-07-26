import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import FilterChip from "./FilterChip";
import { RFValue } from "react-native-responsive-fontsize";
import { filterSublistsAdvanced } from "@/utils/sublists";
import { Sublist } from "@/types/sublist";
import { auth } from "@/firebase/firebaseConfig";

type FilterPickerProps = {
  sublistData: Sublist[]; // pass in filtered sublists
  closeSheet: () => void;
  setFilteredSublists: React.Dispatch<React.SetStateAction<Sublist[]>>;
};

export default function FilterPicker({
  sublistData,
  closeSheet,
  setFilteredSublists,
}: FilterPickerProps) {
  // Filters
  const [owned, setOwned] = useState<boolean | undefined>(undefined);
  const [shared, setShared] = useState<boolean | undefined>(undefined);
  const [visibility, setVisibility] = useState<
    "private" | "friends" | "everyone" | undefined
  >(undefined);
  const [progressStatus, setProgressStatus] = useState<
    "Completed" | "In Progress" | "Getting Started" | undefined
  >(undefined);

  const uid = auth.currentUser?.uid;

  const submitFilters = () => {
    if (!uid) {
      console.error("User ID is not available");
      return;
    }
    closeSheet();
    setFilteredSublists(
      filterSublistsAdvanced(uid, sublistData, {
        owned,
        shared,
        visibility,
        progressStatus,
      })
    );
  };

  return (
    <View style={{ gap: 10 }}>
      <ThemedText type="subtitle">Filter Options</ThemedText>
      <View style={styles.chipsContainer}>
        <ThemedText style={styles.infoText}>Who owns it</ThemedText>
        <View style={styles.innerContainer}>
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            <FilterChip
              onPress={() => {
                setOwned(true);
              }}
              selected={owned === true}
              label="Me"
            />
            <FilterChip
              onPress={() => setOwned(false)}
              selected={owned === false}
              label="Not Me"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setOwned(undefined);
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
              onPress={() => setShared(true)}
              selected={shared === true}
              label="Shared"
            />
            <FilterChip
              onPress={() => setShared(false)}
              selected={shared === false}
              label="Not Shared"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setShared(undefined);
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
              setVisibility(undefined);
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
          <FilterChip
            onPress={() => setVisibility("private")}
            selected={visibility === "private"}
            label="Only Me"
          />
          <FilterChip
            onPress={() => setVisibility("friends")}
            selected={visibility === "friends"}
            label="Friends"
          />

          <FilterChip
            onPress={() => setVisibility("everyone")}
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
              setProgressStatus(undefined);
            }}
          >
            <ThemedText style={styles.clearText}>Clear</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
          <FilterChip
            onPress={() => setProgressStatus("Completed")}
            selected={progressStatus === "Completed"}
            label="Completed"
          />
          <FilterChip
            onPress={() => setProgressStatus("In Progress")}
            selected={progressStatus === "In Progress"}
            label="In Progress"
          />
          <FilterChip
            onPress={() => setProgressStatus("Getting Started")}
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
