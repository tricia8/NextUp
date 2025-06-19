import { useState } from "react";
import { useColorScheme, View } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";

interface CategoryPickerProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpen: () => void;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CategoryPicker({
  open,
  setOpen,
  onOpen,
  selectedTags,
  setSelectedTags,
}: CategoryPickerProps) {
  const colorScheme = useColorScheme();

  const TAG_OPTIONS: ItemType<string>[] = [
    {
      label: "Sports",
      value: "SPORTS",
    },
    {
      label: "Travel",
      value: "TRAVEL",
    },
    {
      label: "Food",
      value: "FOOD",
    },
    {
      label: "Music",
      value: "MUSIC",
    },
    {
      label: "Fitness",
      value: "FITNESS",
    },
    {
      label: "Games",
      value: "GAMES",
    },
    {
      label: "Education",
      value: "EDUCATION",
    },
    {
      label: "Social",
      value: "SOCIAL",
    },
    {
      label: "Volunteering",
      value: "VOLUNTEERING",
    },
    {
      label: "Arts",
      value: "ARTS",
    },
    {
      label: "Tech",
      value: "TECH",
    },
    {
      label: "Others",
      value: "OTHERS",
    },
  ];

  return (
    <View style={{ padding: 10 }}>
      <DropDownPicker
        placeholder="Pick up to 3 tags"
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
        max={3}
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
