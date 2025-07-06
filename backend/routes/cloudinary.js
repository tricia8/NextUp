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
    throw error;
  }
});

export default router;
