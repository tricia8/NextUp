import { PostWithPending } from "@/types/postWithPending";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import ProfilePic from "./ProfilePic";
import { ThemedText } from "./ThemedText";
import ViewMoreContent from "./ViewMoreContent";
import { RFValue } from "react-native-responsive-fontsize";
import PostImage from "./PostImage";
import Carousel, {
  Pagination,
  ICarouselInstance,
} from "react-native-reanimated-carousel";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSharedValue } from "react-native-reanimated";
import { useRef } from "react";

type PostItemProps = {
  item: PostWithPending;
  isDark?: boolean;
  ownerId: string;
  userId: string;
  onDeletePress: (item: PostWithPending) => void;
};

const screenWidth = Dimensions.get("window").width;

export default function PostItem({
  item,
  isDark,
  ownerId,
  userId,
  onDeletePress,
}: PostItemProps) {
  const localProgress = useSharedValue(0);
  const localScrollOffsetValue = useSharedValue(0);
  const localRef = useRef<ICarouselInstance>(null);

  const onPressPagination = (index: number) => {
    localRef.current?.scrollTo({
      count: index - localProgress.value,
      animated: true,
    });
  };

  return (
    <LinearGradient
      colors={isDark ? ["#0f2027", "#664791"] : ["#77c4ff", "#a8b4ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.postContainer, item.isPending && { opacity: 0.5 }]}
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
      {Array.isArray(item?.images) && item?.images.length > 0 && (
        <View>
          <Carousel
            loop
            // autoPlay
            width={screenWidth * 0.7}
            height={240 * 0.7}
            data={item?.images}
            snapEnabled
            pagingEnabled
            onProgressChange={localProgress}
            // mode=""
            style={{ alignSelf: "center" }}
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxScrollingOffset: 50,
            }}
            renderItem={({ index }) => (
              <PostImage source={item?.images[index].secureUrl} />
            )}
            onConfigurePanGesture={(gestureChain) =>
              gestureChain.activeOffsetX([-10, 10])
            }
            defaultScrollOffsetValue={localScrollOffsetValue}
            // customAnimation={animationStyle}
          />
          <Pagination.Basic
            progress={localProgress}
            data={item?.images}
            size={14}
            dotStyle={{
              borderRadius: 100,
              backgroundColor: "#b4b4b4a6",
            }}
            activeDotStyle={{
              borderRadius: 100,
              overflow: "hidden",
              backgroundColor: "#f1f1f1",
            }}
            containerStyle={[
              {
                gap: 5,
                marginBottom: 10,
                position: "absolute",
                bottom: 10,
              },
            ]}
            horizontal
            onPress={onPressPagination}
          />
        </View>
      )}
      <ViewMoreContent content={item?.comment} />
      {ownerId === userId && (
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={() => console.log("Edit Post Pressed")}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather
              name="edit-2"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDeletePress(item)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather
              name="trash-2"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
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
