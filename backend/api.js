import { Router } from "express";
import verifyFirebaseToken from "./authenticate.js";
import sublistsRoutes from "./routes/sublists.js";
import eventsRoutes from "./routes/goals.js";

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests
router.use("/users", sublistsRoutes);
router.use("/users", eventsRoutes);

export default router;
