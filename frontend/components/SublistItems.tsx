import { Sublist } from "@/types/sublist";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ColorSchemeName,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { ThemedText } from "./ThemedText";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Chip } from "react-native-paper";
import { FlashList } from "@shopify/flash-list";
import { RFValue } from "react-native-responsive-fontsize";
import { ReactNode } from "react";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { deleteSubBucketList } from "@/firebase/firestore";
import { showMessage } from "react-native-flash-message";

interface ItemProps {
  uid: string;
  data: Sublist[];
  updateData: React.Dispatch<React.SetStateAction<Sublist[]>>;
  colorScheme: ColorSchemeName;
}

export default function SublistItem({
  uid,
  data,
  updateData,
  colorScheme,
}: ItemProps): ReactNode | Promise<ReactNode> {
  const router = useRouter();
  const styles = getStyles(colorScheme);

  const handleSublistPress = (item: Sublist) => {
    router.push({
      pathname: "/(main)/[sublistId]",
      params: { sublistId: item.id },
    });
  };

  const accessColorMap: Record<string, { bg: string; text: string }> = {
    private: {
      bg: "rgba(231, 208, 242, 0.61)",
      text: "#4e4350",
    },
    friends: { bg: "rgba(159, 236, 250, 0.56)", text: "#11395d" },
    everyone: { bg: "rgba(181, 245, 220, 0.4)", text: "#1b5e20" },
  };

  // delete sublist
  const handleDelete = async (sublist: Sublist) => {
    try {
      console.log("deleting sublist");
      await deleteSubBucketList(uid, sublist);
      console.log("deleted!");
      // update sublists state
      updateData((prevSublists) =>
        prevSublists.filter((list) => list.id !== sublist.id)
      );
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Error deleting sublist",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });
    }
  };

  function renderRightAction(
    progress: SharedValue<number>,
    dragX: SharedValue<number>,
    onDelete: () => void
  ) {
    const styleAnimation = useAnimatedStyle(() => {
      console.log("showLeftProgress:", progress.value);
      console.log("appliedTranslation:", dragX.value);

      // const translateX = dragX.value - 50;
      const translateX = dragX.value + 50;

      // Makes icon grow as swipe progresses
      const scale = interpolate(
        progress.value,
        [0, 1],
        [0.5, 1],
        Extrapolation.CLAMP
        /* dragX.value,
        [-150, 0],
        [1, 0.5],
        // [0, 100],
        // [0.5, 1],
        Extrapolation.CLAMP */
      );

      // Fades icon in as user swipes more.
      const opacity = interpolate(
        progress.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP
        /* dragX.value,
        [-150, -30],
        [1, 0],
        // [0, 80],
        // [0, 1],
        Extrapolation.CLAMP */
      );

      return {
        transform: [{ translateX }, { scale }],
        opacity,
      };

      /* return {
        transform: [{ translateX: dragX.value - 50 }],
      }; */
    });

    return (
      <Reanimated.View style={styleAnimation} pointerEvents="auto">
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <MaterialIcons name="delete" size={30} color="white" />
        </TouchableOpacity>
      </Reanimated.View>
    );
  }

  const renderFlatlistItem = ({ item }: { item: Sublist }) => {
    const panGesture = Gesture.Pan();

    return (
      // <GestureDetector gesture={panGesture}>
      <ReanimatedSwipeable
        simultaneousWithExternalGesture={panGesture}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={50}
        renderRightActions={
          (progress, dragX) =>
            renderRightAction(progress, dragX, () => handleDelete(item))
          /* renderLeftActions={(progress, dragX) =>
          renderLeftAction(progress, dragX, () => handleDelete(item)) */
        }
      >
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
            onPress={() => handleSublistPress(item)}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {item.collaborators.length > 1 ? (
                <Feather
                  name="users"
                  size={24}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              ) : (
                <></>
              )}
              <Chip
                icon="eye"
                style={{
                  borderRadius: 15,
                  backgroundColor: accessColorMap[item.accessLevel].bg,
                }}
                compact={true}
                textStyle={{
                  fontSize: RFValue(10),
                  color: accessColorMap[item.accessLevel].text,
                }}
              >
                {item.accessLevel == "private" ? "only you" : item.accessLevel}
              </Chip>
            </View>

            <View style={styles.subListRow2}>
              <ThemedText type="subtitle" style={styles.listName}>
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
              <ThemedText style={styles.statusText}>
                {item.completionStatus[0]} of {item.completionStatus[1]}{" "}
                complete
              </ThemedText>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </ReanimatedSwipeable>
      // </GestureDetector>
    );
  };

  return (
    <FlashList
      data={data}
      renderItem={renderFlatlistItem}
      estimatedItemSize={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyExtractor={(item, index) => `${item.title}-${index}`}
    />
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
    subListRow2: {
      flexDirection: "row",
      padding: 2,
      justifyContent: "space-between",
    },
    listName: {
      fontSize: RFValue(16),
    },
    statusText: {
      fontSize: RFValue(11),
    },
    deleteButton: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#ec4b6a",
      height: "100%",
      borderRadius: 5,
      zIndex: 100,
    },
  });
