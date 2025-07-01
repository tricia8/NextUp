// Wrapper for all routes implemented in the backend
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Router } from "express";
import db from "./app";
import verifyFirebaseToken from "./authenticate";

dayjs.extend(relativeTime);

const router = Router();
router.use(verifyFirebaseToken); // Authenticate all requests

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

export default router;
