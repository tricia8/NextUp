// Wrapper for all routes implemented in the backend
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Router } from "express";
import db from "./app";
import verifyFirebaseToken from "./authenticate";

dayjs.extend(relativeTime);

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests

// Invite collaborators as an owner
router.patch(
  "/user/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params; // userId should be the owner of the sublist
    const { collaboratorId } = req.body; // userId of invitee
    try {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      if (ownerId !== userId) {
        const err = new Error("Only the owner can invite collaborators");
        err.status = 403; // Permission denied
        throw err;
      }

      docSnap.ref.update({
        collaborators: [...docSnap.data().collaborators, collaboratorId], // Array of userIds
      });

      // Update collaborators array for all goals under this sublist
      const eventsSnap = await docSnap.ref.collection("events").get();

      const updatePromises = eventsSnap.docs.map((docSnap) =>
        docSnap.ref.update([...eventsSnap.data().collaborators, collaboratorId])
      );

      // Add document to sharedSublists for the collaborator
      await db
        .collection("users")
        .doc(collaboratorId)
        .collection("sharedSublists")
        .doc(sublistId)
        .create({
          ownerId: ownerId, // Sublist owner's userId
          permissions: "write",
        });

      // Wait for all event updates to complete
      await Promise.all(updatePromises);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Helper function
const formatSublistData = (data) => {
  // data type: Sublist object
  const createdAt = data.createdAt?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    accessLevel: data.accessLevel,
    collaborators: data.collaborators,
    createdAt: createdAt ? formatDisplayDate(createdAt) : "",
    completionStatus: data.completionStatus,
  };
};

// convert Timestamp to string e.g. "3 days ago (14 Jun)"
const formatDisplayDate = (fetchedDate) => {
  return `${dayjs(fetchedDate).fromNow()} (${dayjs(fetchedDate).format(
    "DD MMM YYYY"
  )})`;
};

const getSublistDocOrThrow = async (userId, sublistId) => {
  // Check if userId matches the sublist owner or is a collaborator
  const sublistDocRef = db
    .collection("users")
    .doc(userId)
    .collection("bucketList")
    .doc(sublistId);
  const docSnap = await sublistDocRef.get();

  if (docSnap.exists) {
    // User is the owner
    return { docSnap, ownerId: userId };
  }

  // If not the owner, check if user is a collaborator
  const sharedSublistDocRef = db
    .collection("users")
    .doc(userId)
    .collection("sharedSublists")
    .doc(sublistId);
  const sharedDocSnap = await sharedSublistDocRef.get();

  if (!sharedDocSnap.exists) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  // Fetch actual sublist data from owner's bucketList
  const { ownerId } = sharedDocSnap.data();
  const ownerSublistSnap = await db
    .collection("users")
    .doc(ownerId)
    .collection("bucketList")
    .doc(sublistId)
    .get();

  if (!ownerSublistSnap.exists) {
    const err = new Error("Sublist not found under owner");
    err.status = 404;
    throw err;
  }
  return { docSnap: ownerSublistSnap, ownerId };
};

const updateOverallStats = async (userId) => {
  try {
    // Query across all bucketList subcollections
    const q = db
      .collectionGroup("bucketList")
      .where("collaborators", "array-contains", userId);

    const snapshot = await q.get();

    let totalEvents = 0;
    let completedEvents = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalEvents += data.completionStatus[1] ?? 0;
      completedEvents += data.completionStatus[0] ?? 0;
    });

    // Save stats (use a clear location)
    const statsRef = db
      .collection("users")
      .doc(userId)
      .collection("bucketList")
      .doc("stats");

    // db.collection("users").doc(userId).collection("meta").doc("stats"); optional alternative location for stats

    await statsRef.set({
      totalEvents,
      completedEvents,
    });

    console.log(`Updated stats for user ${userId}`);
  } catch (error) {
    console.error("Error updating overall stats:", error);
    throw error;
  }
};

// Get a sublist (owners and collaborators only)
router.get(
  "/users/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    try {
      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
      const formatted = formatSublistData(docSnap.data());
      return res.json(formatted);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Update a sublist (owners and collaborators only)
router.patch(
  "/users/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    try {
      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
      await docSnap.ref.update(req.body);
      res.json({ success: true, message: "Sublist updated successfully" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

router.delete(
  "/users/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    try {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      if (ownerId !== userId) {
        const err = new Error("Only the owner can delete this sublist");
        err.status = 403; // Permission denied
        throw err;
      }

      // Delete all goals under this sublist
      const eventsSnap = await docSnap.ref.collection("events").get();

      // Delete all documents in the events collection
      const deletePromises = eventsSnap.docs.map((docSnap) =>
        docSnap.ref.delete()
      );

      // Wait for all deletions to complete since delete is async
      await Promise.all(deletePromises);

      // Delete sublist document
      await docSnap.ref.delete();

      await updateOverallStats(userId);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

export default router;
