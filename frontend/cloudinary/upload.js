import { getIdTokenFromFirebaseUser } from "../utils/getIdToken";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

// For profile pictures
export async function uploadToCloudinary(base64Image, uid, subfolder) {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const public_id = `nextup/users/${uid}/${subfolder}`;
    const folder = `nextup/users/${uid}/${subfolder}`;

    const res = await fetch(
      "https://nextup-l0e9.onrender.com/api/cloudinary/signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder, public_id }),
      }
    );

    const { timestamp, signature, apiKey, cloudName, overwrite } =
      await res.json();

    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("public_id", public_id);
    formData.append("overwrite", overwrite.toString());

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const errMessage = await uploadRes.text();
      throw new Error(`Cloudinary upload failed: ${errMessage}`);
    }

    const data = await uploadRes.json();
    console.log(data);
    return data.secure_url;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// For post images where public_id needs to be unique
export async function uploadPostImageToCloudinary(base64Image, uid, subfolder) {
  try {
    const token = await getIdTokenFromFirebaseUser();

    // const uniqueId = Date.now();
    const public_id = `nextup/users/${uid}/${subfolder}/${uuidv4()}`;
    const folder = `nextup/users/${uid}/${subfolder}`;

    const res = await fetch(
      "https://nextup-l0e9.onrender.com/api/cloudinary/signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder, public_id }),
      }
    );

    const { timestamp, signature, apiKey, cloudName, overwrite } =
      await res.json();

    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("public_id", public_id);
    formData.append("overwrite", overwrite.toString());

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const errMessage = await uploadRes.text();
      throw new Error(`Cloudinary upload failed: ${errMessage}`);
    }

    const data = await uploadRes.json();
    console.log(data);
    return { secureUrl: data.secure_url, publicId: data.public_id };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
