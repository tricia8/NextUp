import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useMemo, useRef } from "react";
import {
  useColorScheme,
  View,
  StyleSheet,
  ColorSchemeName,
} from "react-native";
import FilterPicker from "./FilterPicker";

type FilterModalProps = {
  bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
};

export default function FilterModal({ bottomSheetModalRef }: FilterModalProps) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  // Bottom-sheet modal
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const handleSheetChanges = (index: number) => {
    console.log("handleSheetChanges", index);
  }; // logs to console when snapPoint changes

  const renderBackdrop: React.FC<BottomSheetBackdropProps> = (
    props: BottomSheetBackdropProps
  ) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close" // closes modal when user presses backdrop
    />
  );
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={2}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      keyboardBehavior={"extend"}
      enablePanDownToClose
      backgroundStyle={styles.modalBg}
      enableContentPanningGesture={false}
    >
      <BottomSheetScrollView style={styles.contentContainer}>
        <View style={{ paddingHorizontal: 10, gap: 10, flex: 1 }}>
          <FilterPicker />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    modalBg: {
      borderRadius: 25,
      backgroundColor: colorScheme == "dark" ? "#1e1e2f" : "#eee",
    },
    contentContainer: {
      // backgroundColor: colorScheme == "dark" ? "#1e1e2f" : "#eee",
      padding: 15,
      gap: 15,
    },
  });
