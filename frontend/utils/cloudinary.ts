// Utility to deliver compressed and resized images to save bandwidth and memory
export function getOptimizedCloudinaryUrl(
  originalUrl: string,
  width: number = 720,
  quality: string = "auto"
): string {
  if (!originalUrl.includes("res.cloudinary.com")) return originalUrl;

  return originalUrl.replace("/upload/", `/upload/q_${quality},w_${width}/`);
}
