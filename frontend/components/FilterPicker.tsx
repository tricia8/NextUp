import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { StyleSheet, Touchable, TouchableOpacity, View } from "react-native";
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
      <View style={styles.chipsRow}>
        <ThemedText style={styles.infoText}>Who owns it</ThemedText>
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
          <ThemedText style={styles.infoText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        <ThemedText style={styles.infoText}>Sharing status</ThemedText>
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
          <ThemedText style={styles.infoText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        <ThemedText style={styles.infoText}>Who can see it</ThemedText>

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
        <TouchableOpacity
          onPress={() => {
            setVisibility(undefined);
          }}
        >
          <ThemedText style={styles.infoText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        <ThemedText style={styles.infoText}>Progress status</ThemedText>
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
        <TouchableOpacity
          onPress={() => {
            setProgressStatus(undefined);
          }}
        >
          <ThemedText style={styles.infoText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={closeSheet}>
          <ThemedText>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={submitFilters}>
          <ThemedText>Apply Filters</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  infoText: {
    fontStyle: "italic",
    fontSize: RFValue(11.5),
  },
});
