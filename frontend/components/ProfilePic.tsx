import { FontAwesome } from "@expo/vector-icons";
import { View, Image } from "react-native";
import { ms } from "react-native-size-matters";

type Props = {
  imageUrl: string | null;
  size: number;
  testID?: string;
};

export default function ProfilePic({ imageUrl, size, testID }: Props) {
  return (
    <View>
      {imageUrl ? (
        <Image
          testID={testID}
          source={{ uri: imageUrl }}
          style={{
            width: ms(size),
            height: ms(size),
            borderRadius: ms(size) / 2,
          }}
        />
      ) : (
        <FontAwesome name="user-circle-o" size={ms(size)} color="#7b68ee" />
      )}
    </View>
  );
}
