import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { Touchable, TouchableOpacity, View } from "react-native";
import { Chip } from "react-native-paper";
import FilterChip from "./FilterChip";

export default function FilterPicker() {
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
    <View style={{ gap: 10, flexShrink: 1 }}>
      <ThemedText type="subtitle">Filter Options</ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemedText>Who owns it</ThemedText>
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

      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemedText>Sharing status</ThemedText>
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

      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemedText>Who can see it</ThemedText>
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

      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemedText>Progress status</ThemedText>
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

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity>
          <ThemedText>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity>
          <ThemedText>Apply Filters</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
