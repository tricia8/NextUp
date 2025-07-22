import { Router } from "express";
import cloudinary from "../cloudinaryConfig.js";

const router = Router();

router.post("/signature", (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = req.body.folder;
    const public_id = req.body.public_id;

    let overwrite = false;

    if (public_id.includes("profile_pic")) {
      overwrite = true;
    }

    const paramsToSign = {
      timestamp,
      folder,
      public_id,
      overwrite,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      folder,
      public_id,
      overwrite,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to generate Cloudinary signature." });
  }
});

/* router.post("/delete-image", async (req, res) => {
  try {
    const public_id = req.body.public_id;
    const userId = req.user; // Verified from auth middleware

    // Prevents deletion of images not posted by the user
    if (!public_id.startsWith(`nextup/users/${userId}`)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot delete this image." });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result !== "ok") {
      return res
        .status(500)
        .json({ error: `Failed to delete image: ${result.result}` });
    }
    res.json({ success: true, result });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to delete image from Cloudinary.",
    });
  }
}); */

// POST /api/cloudinary/delete-images
router.post("/delete-images", async (req, res) => {
  try {
    const userId = req.user; // Extracted from auth middleware
    const { public_ids } = req.body;

    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res
        .status(400)
        .json({ error: "public_ids must be a non-empty array" });
    }

    const failed = []; // To track failed deletions
    const deleted = [];

    for (const public_id of public_ids) {
      if (!public_id.startsWith(`nextup/users/${userId}`)) {
        failed.push({ public_id, error: "Unauthorized or invalid path" });
        continue;
      }

      let attempts = 0;
      let success = false;
      let result;

      // Retry logic for image deletion
      while (attempts < 3 && !success) {
        result = await cloudinary.uploader.destroy(public_id);

        // Image successfully removed from Cloudinary
        if (result.result === "ok" || result.result === "not_found") {
          deleted.push(public_id);
          success = true;
        } else {
          //
          await new Promise((resolve) => setTimeout(resolve, 500)); // delay before retry
        }

        attempts++;
      }

      if (!success) {
        failed.push({ public_id, error: result.result || "Unknown error" });
        console.warn(
          `Failed to delete image after 3 attempts: ${public_id}, result: ${result.result}`
        );
      }
    }

    const success = failed.length === 0;

    // 207 for partial success
    res.status(success ? 200 : 207).json({
      success,
      deleted,
      failed,
    });
  } catch (error) {
    console.error("Batch delete error:", error);
    res.status(500).json({ error: "Failed to delete images from Cloudinary" });
  }
});

export default router;
