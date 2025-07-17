import { LegendList } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { Post } from "@/types/post";
import ProfilePic from "./ProfilePic";
import { ThemedText } from "./ThemedText";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { RFValue } from "react-native-responsive-fontsize";
import ViewMoreContent from "./ViewMoreContent";

type PostListProps = {
  userId: string;
  isDark?: boolean;
};

export default function PostList({ userId, isDark = false }: PostListProps) {
  const DATA: Post[] = [
    {
      id: "109384",
      userId: userId,
      username: "john_doe",
      profilePhotoUrl: "",
      createdAt: "3 June 2025, 3:59pm ",
      updatedAt: "3 June 2025, 4:59pm ",
      comment:
        "This is a sample post. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      imageUrl: "https://picsum.photos/200/300",
    },
  ];

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <LinearGradient
        colors={isDark ? ["#0f2027", "#664791"] : ["#77c4ff", "#a8b4ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.postContainer}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexShrink: 1,
            marginBottom: 5,
          }}
        >
          <ProfilePic imageUrl={item?.profilePhotoUrl} size={30} />
          <ThemedText style={styles.text}>
            {item?.username} {userId === item?.userId ? "(You)" : ""}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={isDark ? "white" : "black"}
            />
            <ThemedText style={styles.text}>{item?.createdAt}</ThemedText>
          </View>
        </View>
        <Image
          source={{ uri: item?.imageUrl }}
          style={{ width: "100%", height: 200, borderRadius: 10 }}
        />
        <ViewMoreContent content={item?.comment} />
        <TouchableOpacity
          onPress={() => console.log("Edit Post Pressed")}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={{ alignSelf: "flex-end" }}
        >
          <Feather name="edit-2" size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  return (
    <LegendList
      data={DATA}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 3,
    flexShrink: 1,
  },
  text: {
    fontSize: RFValue(10),
  },
});
