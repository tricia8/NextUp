import React from "react";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Gesture } from "react-native-gesture-handler";
import { TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SwipeableRowProps {
  children: React.ReactNode; // Contents of the row, e.g. flatlist
  onDelete: () => void;
  renderRightAction?: (
    progress: SharedValue<number>,
    dragX: SharedValue<number>,
    onDelete: () => void
  ) => React.ReactNode;
}

// Swipe left to delete
export default function SwipeableRow({
  children,
  onDelete,
  renderRightAction,
}: SwipeableRowProps) {
  const panGesture = Gesture.Pan();

  // Default right action if not provided
  const defaultRenderRightAction = (
    progress: SharedValue<number>,
    dragX: SharedValue<number>,
    onDelete: () => void
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      const translateX = dragX.value + 50;
      const scale = interpolate(
        progress.value,
        [0, 1],
        [0.5, 1],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        progress.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP
      );
      return { transform: [{ translateX }, { scale }], opacity };
    });

    return (
      <Reanimated.View style={styleAnimation} pointerEvents="auto">
        <TouchableOpacity
          style={styles.deleteButton}
          testID="delete-button"
          onPress={onDelete}
        >
          <MaterialIcons name="delete" size={30} color="white" />
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

  return (
    <ReanimatedSwipeable
      simultaneousWithExternalGesture={panGesture}
      friction={2}
      enableTrackpadTwoFingerGesture
      leftThreshold={50}
      renderRightActions={(progress, dragX) =>
        (renderRightAction ?? defaultRenderRightAction)(
          progress,
          dragX,
          onDelete
        )
      }
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
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
