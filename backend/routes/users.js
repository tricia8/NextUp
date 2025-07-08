import { Router } from "express";
import db from "../app.js";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  getDocs,
} from "firebase/firestore";

const router = Router();

// Create user
router.post("/users", async (req, res) => {
  const authUserId = req.user;
  const { uid, username, email } = req.body;

  if (!uid || !username || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (authUserId !== uid) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const userRef = doc(db, "users", uid);
  const usernameRef = doc(db, "usernames", username);
  const bucketListStatsRef = doc(db, "users", uid, "bucketList", "stats");

  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists()) {
        throw new Error("Username already taken.");
      }

      transaction.set(userRef, {
        uid,
        username,
        email,
        photoUrl: null,
        displayName: username,
        bio: "",
        category: null,
      });

      transaction.set(usernameRef, { uid });

      transaction.set(bucketListStatsRef, {
        totalEvents: 0,
        completedEvents: 0,
      });
    });

    return res.status(201).json({ success: true, message: "User created" });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update profile
router.patch("/users/updateProfile", async (req, res) => {
  const userId = req.user;
  const newData = req.body;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const existingData = userSnap.data();
    const updatedFields = {};

    for (const key in newData) {
      if (newData[key] !== existingData[key]) {
        updatedFields[key] = newData[key];
      }
    }

    if (Object.keys(updatedFields).length > 0) {
      await updateDoc(userRef, updatedFields);
      console.log("Updated fields:", updatedFields);
      return res
        .status(200)
        .json({ message: "Profile updated", updatedFields });
    } else {
      console.log("No fields were changed. Skipping update.");
      return res.status(200).json({ message: "No changes detected" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get profile
router.get("/users/:uid/profile", async (req, res) => {
  const { uid } = req.params;

  try {
    const docRef = doc(db, "users", uid);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = docSnapshot.data();

    return res.status(200).json({
      uid: docSnapshot.id,
      username: data.username,
      email: data.email,
      photoUrl: data.photoUrl,
      displayName: data.displayName,
      bio: data.bio,
      category: data.category,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        username: data.username,
        photoUrl: data.photoUrl,
        email: data.email,
        displayName: data.displayName,
        bio: data.bio,
        category: data.category,
      };
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
