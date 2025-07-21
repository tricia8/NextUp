import { LegendList } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Post } from "@/types/post";
import ProfilePic from "./ProfilePic";
import { ThemedText } from "./ThemedText";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { RFValue } from "react-native-responsive-fontsize";
import ViewMoreContent from "./ViewMoreContent";
import { PostWithPending } from "@/types/postWithPending";
import Carousel, { TAnimationStyle } from "react-native-reanimated-carousel";
import { useCallback } from "react";
import { interpolate } from "react-native-reanimated";
import PostImage from "./PostImage";

type PostListProps = {
  userId: string;
  posts: PostWithPending[];
  isDark?: boolean;
};

const screenWidth = Dimensions.get("window").width;

export default function PostList({
  userId,
  posts,
  isDark = false,
}: PostListProps) {
  const DATA: PostWithPending[] = [
    {
      id: "109384",
      userId: userId,
      username: "john_doe",
      profilePhotoUrl: "",
      createdAt: "3 June 2025, 3:59pm ",
      updatedAt: "3 June 2025, 4:59pm ",
      isPending: false,
      comment:
        "This is a sample post. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      imageUrls: ["https://picsum.photos/200/300"],
    },
  ];

  const animationStyle: TAnimationStyle = useCallback((value: number) => {
    "worklet";

    const zIndex = interpolate(value, [-1, 0, 1], [10, 20, 30]);
    const scale = interpolate(value, [-1, 0, 1], [1.25, 1, 0.25]);
    const opacity = interpolate(value, [-0.75, 0, 1], [0, 1, 0]);

    return {
      transform: [{ scale }],
      zIndex: Math.round(zIndex),
      opacity,
    };
  }, []);

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
        {Array.isArray(item?.imageUrls) && item?.imageUrls.length > 0 && (
          <>
            {/* <Image
              source={{ uri: item.imageUrls[0] }}
              style={{ width: "100%", height: 200, borderRadius: 10 }}
            /> */}
            <Carousel
              loop
              autoPlay
              width={screenWidth * 0.7}
              height={240 * 0.7}
              data={item?.imageUrls}
              snapEnabled
              mode="parallax"
              renderItem={({ index }) => (
                <PostImage source={item?.imageUrls[index]} />
              )}
              onConfigurePanGesture={(gestureChain) =>
                gestureChain.activeOffsetX([-10, 10])
              }
              customAnimation={animationStyle}
            />
          </>
        )}
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
      data={posts}
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
