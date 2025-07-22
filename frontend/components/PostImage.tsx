import Animated from "react-native-reanimated";
import { type ImageStyle, type StyleProp, StyleSheet } from "react-native";

type PostImageProps = {
  source: string;
  style?: StyleProp<ImageStyle>;
};

export default function PostImage({ source, style }: PostImageProps) {
  return (
    <Animated.View style={{ flex: 1 }}>
      <Animated.Image
        style={[style, styles.container, { borderRadius: 15 }]}
        source={{ uri: source }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
});
