import { Router } from "express";
import verifyFirebaseToken from "./authenticate.js";
import bucketlistRoutes from "./routes/bucketlist.js";
import geminiRoutes from "./routes/gemini.js";

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests
router.use("/", bucketlistRoutes);
router.use("/gemini", geminiRoutes);

export default router;
