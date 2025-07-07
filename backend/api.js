import { Router } from "express";
import verifyFirebaseToken from "./authenticate.js";
import cloudinaryRoutes from "./routes/cloudinary.js";
import bucketlistRoutes from "./routes/bucketlist.js";
import geminiRoutes from "./routes/gemini.js";
import friendRoutes from "./routes/friends.js"

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests

router.use("/cloudinary", cloudinaryRoutes);
router.use("/", bucketlistRoutes);
router.use("/gemini", geminiRoutes);
router.use("/", friendRoutes);

export default router;
