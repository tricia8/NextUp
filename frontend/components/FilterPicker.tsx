import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FilterChip from "./FilterChip";
import { RFValue } from "react-native-responsive-fontsize";

type FilterPickerProps = {
  closeSheet: () => void;
};

export default function FilterPicker({ closeSheet }: FilterPickerProps) {
  // Filters
  const [owned, setOwned] = useState<boolean | undefined>(undefined);
  const [shared, setShared] = useState<boolean | undefined>(undefined);
  const [visibility, setVisibility] = useState<
    "private" | "friends" | "everyone" | undefined
  >(undefined);
  const [progressStatus, setProgressStatus] = useState<
    "Completed" | "In Progress" | "Getting Started" | undefined
  >(undefined);

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
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={closeSheet}>
          <ThemedText>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={closeSheet}>
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
