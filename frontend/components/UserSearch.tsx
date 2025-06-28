import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Image,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { LegendList } from "@legendapp/list";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { User } from "@/types/user";
import { router } from "expo-router";
import ProfilePic from '@/components/ProfilePic';

type Props = {
  users: User[];
  showAddButton?: boolean;
  placeholder?: string;
  userId?: string;
  friendUids?: string[];
  handleAddFriend?: (friendId: string) => Promise<void>;
};

export default function UserSearch({
  users,
  showAddButton = false,
  placeholder = "",
  userId,
  friendUids,
  handleAddFriend,
}: Props) {
  const [search, setSearch] = React.useState<string>("");
  const [filteredUsers, setUsers] = React.useState<User[]>([]);
  const colorScheme = useColorScheme();
  const styles = makeStyles(colorScheme);

  useEffect(() => {
    setUsers(users);
  }, [users]);

  const filterData = (text: string) => {
    const formattedQuery = text.toLowerCase();
    const filtered = users.filter((item) => {
      return item.username.toLowerCase().includes(formattedQuery);
    });
    setUsers(filtered);
    setSearch(text);
  };

  const isFriend = (uid: string) => {
    return friendUids?.includes(uid);
  };


  function renderItem({ item }: { item: User }) {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/profile/[uid]",
            params: { uid: item.uid },
          })
        }
      >
        <View style={styles.userRowContainer}>
          <View style={styles.userDisplay}>
            <ProfilePic imageUrl={item.photoUrl} size={40}/>

            <ThemedText style={{ fontSize: RFValue(14) }}>
              {item.username}
            </ThemedText>
          </View>
          {showAddButton && !isFriend(item.uid) && userId != item.uid && (
            <TouchableOpacity onPress={() => handleAddFriend?.(item.uid)}>
              <MaterialIcons
                name="person-add-alt-1"
                color="white"
                size={ms(22)}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="gray"
          selectionColor="gray"
          value={search}
          onChangeText={(text) => filterData(text)}
        />
      </View>

      <LegendList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.uid}
        recycleItems={true}
        maintainVisibleContentPosition
      />
    </View>
  );
}

const makeStyles = (colorScheme: any) =>
  StyleSheet.create({
    searchContainer: {
      paddingHorizontal: s(15),
      paddingVertical: vs(15),
      backgroundColor: "transparent",
      borderColor: "#7b68ee",
      borderBottomWidth: 1,
    },
    input: {
      height: vs(35),
      borderColor: "#7b68ee",
      borderWidth: 1,
      paddingHorizontal: s(10),
      borderRadius: 10,
      color: colorScheme === "dark" ? "white" : "black",
      backgroundColor: "transparent",
    },
    userRowContainer: {
      justifyContent: "space-between",
      flexDirection: "row",
      paddingHorizontal: s(20),
      paddingVertical: vs(4),
      alignItems: "center",
    },
    userDisplay: {
      flexDirection: "row",
      alignItems: "center",
      gap: s(12),
    },
  });
