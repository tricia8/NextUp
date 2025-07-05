import { Router } from "express";
import verifyFirebaseToken from "./authenticate.js";
import bucketlistRoutes from "./routes/bucketlist.js";

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests
router.use("/", bucketlistRoutes);

export default router;
