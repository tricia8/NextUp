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

// Get a sublist (owners and collaborators only)
router.get(
  "/users/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    try {
      // Check if userId matches the sublist owner or is a collaborator
      const sublistDocRef = db
        .collection("users")
        .doc(userId)
        .collection("bucketList")
        .doc(sublistId);
      const docSnap = await sublistDocRef.get();

      if (docSnap.exists) {
        // User is the owner
        const formatted = formatSublistData(docSnap.data());
        return res.json(formatted);
      }

      // If not the owner, check if user is a collaborator
      const sharedSublistDocRef = db
        .collection("users")
        .doc(userId)
        .collection("sharedSublists")
        .doc(sublistId);
      const sharedDocSnap = await sharedSublistDocRef.get();

      if (!sharedDocSnap.exists) {
        return res.status(403).json({ error: "Access denied" });
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
        return res.status(404).json({ error: "Sublist not found under owner" });
      }
      const formatted = formatSublistData(ownerSublistSnap.data());
      return res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
