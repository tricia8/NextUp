import Animated from "react-native-reanimated";
import { type ImageStyle, type StyleProp, StyleSheet } from "react-native";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";

type PostImageProps = {
  source: string;
  style?: StyleProp<ImageStyle>;
};

export default function PostImage({ source, style }: PostImageProps) {
  const optimizedUri = getOptimizedCloudinaryUrl(
    encodeURI(source),
    720,
    "auto"
  );

  return (
    <Animated.Image
      style={[style, styles.container, { borderRadius: 15 }]}
      source={{ uri: optimizedUri }}
      onError={(e) => console.log("Image failed to load", e.nativeEvent)}
      resizeMode="cover"
      resizeMethod="resize"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
});
