import { LinearGradient } from "expo-linear-gradient";
import {
  ColorSchemeName,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import { ThemedText } from "./ThemedText";
import { RFValue } from "react-native-responsive-fontsize";
import { Goal } from "@/types/goal";
import CategoryChips from "./CategoryChips";

interface Props extends Partial<Goal> {
  title: string;
  isCompleted: boolean;
  categories?: string[];
  deadline?: string;
  onPress: () => void;
  colorScheme: ColorSchemeName;
}

export default function GoalCard({
  title,
  isCompleted,
  categories = [],
  deadline,
  onPress,
  colorScheme,
}: Props) {
  const styles = getStyles(colorScheme);

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#0f2027", "#188991"] : ["#d0e6fa", "#b3d2f2"] // ["#dcf4a9", "#b2df75"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.itemContainer}
    >
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <View style={styles.row}>
          {deadline && (
            <FontAwesome6 name="hourglass-half" size={20} color="#f64b4b" />
          )}
          <CategoryChips selectedTags={categories} />
        </View>

        <View style={styles.titleRow}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <AntDesign name="right" size={18} color="black" />
        </View>

        {/* Status Row */}
        <View>
          <ThemedText style={styles.status}>
            Status: {isCompleted ? "Done!" : "Pending "}
          </ThemedText>
          {deadline && (
            <ThemedText style={styles.status}>Due: {deadline}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    itemContainer: {
      flexDirection: "column",
      marginVertical: 8,
      marginHorizontal: 15,
      padding: 20,
      justifyContent: "space-between",
      borderRadius: 5,
      elevation: 5,
    },
    row: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 2,
    },
    title: {
      fontSize: RFValue(16),
    },
    status: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#bfbfbf" : "#228669",
    },
  });
