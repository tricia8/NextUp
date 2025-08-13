// Flatlist for displaying images in a post form

import {
  FlatList,
  TouchableOpacity,
  View,
  Image,
  useColorScheme,
  TouchableHighlight,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { addMoreImages } from "@/cloudinary/pickimage";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

type ImageViewerProps = {
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setBase64: React.Dispatch<React.SetStateAction<string[] | null>>;
  onRemove?: (imageUrl: string) => void;
};

export default function ImageViewer({
  selectedImages,
  setSelectedImages,
  setBase64,
  onRemove,
}: ImageViewerProps) {
  // each image can be removed by clicking on the close icon
  const isDark = useColorScheme() === "dark";

  const onPressAdd = async () => {
    const newImageUrls = await addMoreImages(
      setSelectedImages,
      selectedImages.length
    );
    setBase64((prev) => {
      if (prev === null) {
        return newImageUrls ? newImageUrls : null;
      }
      return newImageUrls ? [...prev, ...newImageUrls] : prev;
    });
  };

  const onRemoveDefault = (imageUrl: string) => {
    const index = selectedImages.indexOf(imageUrl);
    setSelectedImages((prev) => prev.filter((url) => url !== imageUrl));
    setBase64((prev) => {
      if (prev === null) return null;

      if (index > -1) {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      }

      return prev;
    });
  };

  const renderItem = ({ item }: { item: string | { addMore: boolean } }) => {
    if (typeof item === "object" && item.addMore) {
      return (
        <TouchableHighlight
          style={{
            width: "39%",
            height: "100%",
            // backgroundColor: "#eeeeee",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 25,
          }}
          underlayColor={"#eeeeee98"}
          onPress={onPressAdd}
        >
          <Ionicons
            name="add-circle"
            size={33}
            color={isDark ? "#64748c" : "#64748ce1"}
          />
        </TouchableHighlight>
      );
    }

    return (
      <View style={{ width: screenWidth * 0.45, marginBottom: 25 }}>
        <Image
          source={{ uri: item as string }}
          style={{ width: "100%", height: 150, borderRadius: 25 }}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 0,
            top: 0,
          }}
          onPress={
            onRemove
              ? () => onRemove(item as string)
              : () => onRemoveDefault(item as string)
          }
        >
          <Ionicons name="close-circle" size={30} color="#64748ce1" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator
      keyExtractor={(_item, index) => index.toString()}
      renderItem={renderItem}
      data={
        selectedImages.length < 5
          ? [...selectedImages, { addMore: true }]
          : selectedImages
      }
      contentContainerStyle={{ gap: 10, paddingRight: 100 }}
    />
  );
}
