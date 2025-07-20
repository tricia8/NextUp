import * as ImagePicker from "expo-image-picker";

export async function pickImage(setImage) {
  try {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const base64 = result.assets[0].base64;
      return `data:image/jpeg;base64,${base64}`; // Cloudinary-ready
    }

    return null;
  } catch (error) {
    console.log(error);
  }
}

// Multiple image picker
export async function pickMultipleImages(setImages) {
  try {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      presentationStyle: ImagePicker.PresentationStyle.FullScreen,
      // allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
      const base64Images = result.assets.map(
        (asset) => `data:image/jpeg;base64,${asset.base64}`
      );
      return base64Images; // Cloudinary-ready
    }

    return null;
  } catch (error) {
    console.log(error);
  }
}
