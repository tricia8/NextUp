import * as ImagePicker from "expo-image-picker";

export async function pickImage(setImage) {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    alert("Permission to access media library is required!");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    mediaTypes: ["image"],
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
}
