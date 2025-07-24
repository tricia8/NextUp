import React, { useEffect, useState } from "react";
import { ColorSchemeName } from "react-native";
import { User } from "@/types/user";
import ProfilePic from "@/components/ProfilePic";
import { debouncePress } from "@/utils/debouncePress";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import InviteeBadge from "./InviteeBadge";
// pass in collaborators array from sublist as prop

type Props = {
  colorScheme: ColorSchemeName;
  allUsers: User[];
  placeholder?: string;
  invitedUsers: string[]; // array of user IDs
  setInvitedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  collaboratorUids?: string[];
  handleAddUser?: (invitee: User) => void;
};

export default function UserSearchPicker({
  colorScheme,
  allUsers,
  placeholder = "Add users",
  invitedUsers = [],
  setInvitedUsers,
  collaboratorUids = [], // collaborators array
  handleAddUser,
}: Props) {
  const [open, setOpen] = useState(false); // for search dropdown
  const [userItems, setUserItems] = useState<ItemType<string>[]>([]);
  const [userItemsLoading, setUserItemsLoading] = useState(false); // loading state for user items

  console.log("User items:", userItems);
  useEffect(() => {
    setUserItemsLoading(true);
    if (allUsers && allUsers.length > 0) {
      setUserItems(
        allUsers
          .filter((user) => !collaboratorUids.includes(user.uid))
          .map((user) => ({
            label: user.username,
            value: user.uid,
            icon: () => <ProfilePic imageUrl={user?.photoUrl} size={30} />,
          }))
      );
      setUserItemsLoading(false);
    } else {
      setUserItems([]);
      setUserItemsLoading(false);
    }
  }, [allUsers, collaboratorUids]);

  return (
    <DropDownPicker
      loading={userItemsLoading}
      placeholder={placeholder}
      placeholderStyle={{
        paddingHorizontal: 10,
        paddingVertical: 12,
      }}
      multiple={true}
      min={0}
      schema={{
        label: "label",
        value: "value",
        icon: "icon",
      }}
      value={invitedUsers}
      setValue={setInvitedUsers}
      open={open}
      setOpen={setOpen}
      items={userItems}
      itemKey="value"
      listItemContainerStyle={{
        margin: 4,
      }}
      searchable={true}
      searchPlaceholder="Find users..."
      closeOnBackPressed={true}
      theme={colorScheme === "dark" ? "DARK" : "LIGHT"}
      listMode="FLATLIST"
      flatListProps={{ nestedScrollEnabled: true }}
      mode="BADGE"
      extendableBadgeContainer={true}
      renderBadgeItem={({ label, value, onPress }) => (
        <InviteeBadge label={label} value={value as string} onPress={onPress} />
      )}
      onChangeValue={(value) => {
        console.log(value);
      }}
      zIndex={3000}
      scrollViewProps={{
        nestedScrollEnabled: true,
        showsVerticalScrollIndicator: true,
      }}
      dropDownContainerStyle={{
        maxHeight: 250,
        zIndex: 3000,
        elevation: 3000,
      }}
    />
  );
}
