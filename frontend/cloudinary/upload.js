import { getIdTokenFromFirebaseUser } from "../utils/getIdToken";

const token = await getIdTokenFromFirebaseUser();

export async function uploadToCloudinary(base64Image, uid, subfolder) {
  try {
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

    const data = await uploadRes.json();
    console.log(data);
    return data.secure_url;
  } catch (error) {
    console.log(error);
  }
}
