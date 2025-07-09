import { Router } from "express";
import verifyFirebaseToken from "./authenticate.js";
import cloudinaryRoutes from "./routes/cloudinary.js";
import bucketlistRoutes from "./routes/bucketlist.js";
import geminiRoutes from "./routes/gemini.js";
import friendRoutes from "./routes/friends.js";
import userRoutes from "./routes/users.js";
import usernameRoutes from "./routes/username.js";

const router = Router();

router.use("/", usernameRoutes);

router.use(verifyFirebaseToken); // Authenticate all requests

router.use("/cloudinary", cloudinaryRoutes);
router.use("/", bucketlistRoutes);
router.use("/gemini", geminiRoutes);
router.use("/", friendRoutes);
router.use("/", userRoutes);

export default router;
