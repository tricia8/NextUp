import { useState } from "react";
import { useColorScheme, View } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";

interface CategoryPickerProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpen: () => void;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  max: number,
}

export default function CategoryPicker({
  open,
  setOpen,
  onOpen,
  selectedTags,
  setSelectedTags,
  max,
}: CategoryPickerProps) {
  const colorScheme = useColorScheme();

  const TAG_OPTIONS: ItemType<string>[] = [
    {
      label: "Sports",
      value: "Sports",
    },
    {
      label: "Travel",
      value: "Travel",
    },
    {
      label: "Food",
      value: "Food",
    },
    {
      label: "Music",
      value: "Music",
    },
    {
      label: "Fitness",
      value: "Fitness",
    },
    {
      label: "Games",
      value: "Games",
    },
    {
      label: "Education",
      value: "Education",
    },
    {
      label: "Social",
      value: "Social",
    },
    {
      label: "Volunteering",
      value: "Volunteering",
    },
    {
      label: "Arts",
      value: "Arts",
    },
    {
      label: "Tech",
      value: "Tech",
    },
    {
      label: "Others",
      value: "Others",
    },
  ];

  return (
    <View style={{ padding: 10 }}>
      <DropDownPicker
        placeholder={`Pick up to ${max}`}
        placeholderStyle={{
          paddingHorizontal: 10,
          paddingVertical: 20,
        }}
        schema={{
          label: "label",
          value: "value",
        }}
        multiple={true}
        min={0}
        max={max}
        value={selectedTags}
        setValue={setSelectedTags}
        open={open}
        setOpen={setOpen}
        onOpen={onOpen}
        autoScroll={true}
        items={TAG_OPTIONS}
        searchable={true}
        searchPlaceholder="Find tag..."
        closeOnBackPressed={true}
        theme={colorScheme === "dark" ? "DARK" : "LIGHT"}
        listMode="SCROLLVIEW"
        mode="BADGE"
        extendableBadgeContainer={true}
        badgeDotColors={[
          "#e76f51",
          "#00b4d8",
          "#e9c46a",
          "#e76f51",
          "#8ac926",
          "#00b4d8",
          "#e9c46a",
        ]}
        onChangeValue={(value) => {
          console.log(value);
        }}
        zIndex={3000}
        scrollViewProps={{
          nestedScrollEnabled: true,
          showsVerticalScrollIndicator: true,
        }}
        containerStyle={{
          zIndex: 3000,
          elevation: 3000,
        }}
      />
    </View>
  );
}
