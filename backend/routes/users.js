import { Router } from "express";
import db from "../app.js";

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

  const userRef = db.doc(`users/${uid}`);
  const usernameRef = db.doc(`usernames/${username}`);
  const bucketListStatsRef = db.doc(`users/${uid}/bucketList/stats`);

  try {
    await db.runTransaction(async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists) {
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
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
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
      await userRef.update(updatedFields);
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
    const docRef = db.doc(`users/${uid}`);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
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

// Batch fetching user profiles
router.post("/users/profiles", async (req, res) => {
  const { uids } = req.body;

  if (!Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({ error: "Invalid or empty user IDs array" });
  }

  try {
    const userRefs = uids.map((uid) => db.doc(`users/${uid}`));
    const userSnapshots = await db.getAll(...userRefs); // getAll accepts up to 100 document references

    const users = userSnapshots
      .map((doc) => {
        if (!doc.exists) {
          return null; // Skip non-existent users
        }
        const data = doc.data();
        return {
          uid: doc.id,
          username: data.username,
          email: data.email,
          photoUrl: data.photoUrl,
          displayName: data.displayName,
          bio: data.bio,
        };
      })
      .filter((user) => user !== null); // Filter out nulls

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return res.status(500).json({ error: "Failed to fetch user profiles" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

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
