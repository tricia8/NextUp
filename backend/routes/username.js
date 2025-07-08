import { Router } from "express";
import db from "../app.js";
import {
  doc,
  getDoc,
} from "firebase/firestore";

const router = Router();

// Check unique username
router.get("/checkUsername", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername.length < 1 || normalizedUsername.length > 15) {
    return res.status(400).json({ error: "Username must be 1–15 characters" });
  }

  try {
    const usernameRef = doc(db, "usernames", normalizedUsername);
    const usernameSnap = await getDoc(usernameRef);

    return res.status(200).json({
      available: !usernameSnap.exists(),
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
