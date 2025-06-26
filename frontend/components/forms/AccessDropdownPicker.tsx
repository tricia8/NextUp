import Feather from "@expo/vector-icons/Feather";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useState } from "react";
import { useColorScheme, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

interface AccessDropdownPickerProps {
  accessLevel: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  onChangeValue?: (value: string | string[] | null) => void;
  theme: "LIGHT" | "DARK" | "DEFAULT";
  zindex?: number | undefined;
  isDisabled?: boolean;
}

export default function AccessDropdownPicker({
  accessLevel,
  onChange,
  onChangeValue = () => {},
  theme = "DEFAULT", // default option is LIGHT
  zindex,
  isDisabled = false,
}: AccessDropdownPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isOpen, setIsOpen] = useState(false);

  const accessOptions = [
    {
      label: "Only you can view",
      value: "private",
      icon: () => (
        <Feather name="user" size={24} color={isDark ? "white" : "black"} />
      ),
    },
    {
      label: "Only friends can view",
      value: "friends",
      icon: () => (
        <Feather name="users" size={24} color={isDark ? "white" : "black"} />
      ),
    },
    {
      label: "Everyone (any user) can view",
      value: "everyone",
      icon: () => (
        <SimpleLineIcons
          name="globe"
          size={24}
          color={isDark ? "white" : "black"}
        />
      ),
    },
  ];

  return (
    <DropDownPicker
      open={isOpen}
      placeholder="Who can view this?"
      value={accessLevel}
      items={accessOptions}
      setOpen={setIsOpen}
      setValue={onChange}
      listMode="SCROLLVIEW"
      theme={theme}
      zIndex={zindex}
      disabled={isDisabled}
      onChangeValue={onChangeValue}
    />
  );
}
