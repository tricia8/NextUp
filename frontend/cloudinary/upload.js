export async function uploadToCloudinary(base64Image, folder) {
  const res = await fetch("http://localhost:3000/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  const { timestamp, signature, apiKey, cloudName } = await res.json();

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await uploadRes.json();
  return data.secure_url;
}