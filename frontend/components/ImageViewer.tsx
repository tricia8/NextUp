// Flatlist for displaying images in a post form

import { FlatList, TouchableOpacity, View, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type ImageViewerProps = {
  selectedImages: string[];
  onRemove: (imageUrl: string) => void;
};

export default function ImageViewer({ selectedImages }: ImageViewerProps) {
  // each image can be removed by clicking on the close icon
  const renderItem = ({ item }: { item: string | { addMore: boolean } }) => {
    if (typeof item === "object" && item.addMore) {
      return (
        <TouchableOpacity
          style={{
            width: "35%",
            height: "100%",
            // backgroundColor: "#eeeeee",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="add-circle" size={25} color="black" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ width: "48%", marginBottom: 25 }}>
        <Image
          source={{ uri: item as string }}
          style={{ width: "100%", height: 150, borderRadius: 25 }}
          resizeMode="cover"
        />
        <Ionicons
          name="close-circle"
          size={24}
          color="black"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
      </View>
    );
  };

  return (
    <FlatList
      horizontal
      keyExtractor={(_item, index) => index.toString()}
      renderItem={renderItem}
      data={
        selectedImages.length < 5
          ? [...selectedImages, { addMore: true }]
          : selectedImages
      }
    />
  );
}
