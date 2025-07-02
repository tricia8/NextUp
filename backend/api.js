// Wrapper for all routes implemented in the backend
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Router } from "express";
import db from "./app";
import verifyFirebaseToken from "./authenticate";
import { WriteBatch } from "firebase-admin/firestore";
import { serverTimestamp, Timestamp } from "firebase-admin/firestore";

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
      await db.runTransaction(async (transaction) => {
        const { docSnap, ownerId } = await getSublistDocOrThrow(
          userId,
          sublistId
        );

        if (ownerId !== userId) {
          const err = new Error("Only the owner can invite collaborators");
          err.status = 403; // Permission denied
          throw err;
        }

        const collaborators = docSnap.data().collaborators || [];

        // Prevent duplicates
        if (collaborators.includes(collaboratorId)) {
          throw new Error("User is already a collaborator");
        }

        transaction.update(docSnap.ref, {
          collaborators: [...collaborators, collaboratorId], // Array of userIds
        });

        // Update collaborators array for all goals under this sublist
        const eventsSnap = await docSnap.ref.collection("events").get();
        eventsSnap.docs.forEach((eventDoc) => {
          const eventCollaborators = eventDoc.data().collaborators || [];
          if (!eventCollaborators.includes(collaboratorId)) {
            transaction.update(eventDoc.ref, {
              collaborators: [...eventCollaborators, collaboratorId],
            });
          }
        });

        // Add document to sharedSublists for the collaborator
        const shareSublistDocRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistId);

        transaction.set(shareSublistDocRef, {
          ownerId: ownerId, // Sublist owner's userId
          permissions: "write",
        });
      });

      // Update overall stats for new collaborator
      await updateOverallStats(collaboratorId);

      return res.json({
        success: true,
        message: "Collaborator added",
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Helper function
const formatSublistData = (data) => {
  // data type: Sublist object
  const updatedAt = data.updatedAt?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    accessLevel: data.accessLevel,
    collaborators: data.collaborators,
    updatedAt: updatedAt ? formatDisplayDate(updatedAt) : "",
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

// Helper function to format event data
const formatEventData = (data) => {
  // data type: Event object
  const updatedAt = data.updatedAt?.toDate?.();
  const deadline = data.deadline?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    categories: data.categories ?? [], // default to empty array
    deadline: deadline ? formatDisplayDate(deadline) : "",
    isCompleted: data.isCompleted,
    updatedAt: updatedAt ? formatDisplayDate(updatedAt) : "",
  };
};

// Helper function to fetch all events of a sublist
async function getAllEventsFormatted(userId, sublistId) {
  const allEvents = [];

  const completedEventsRef = db
    .collection("users")
    .doc(userId)
    .collection("bucketList")
    .doc(sublistId)
    .collection("events")
    .where("isCompleted", "==", true)
    .orderBy("updatedAt", "desc"); // Order by updated date, most recent first

  const incompleteEventsRef = db
    .collection("users")
    .doc(userId)
    .collection("bucketList")
    .doc(sublistId)
    .collection("events")
    .where("isCompleted", "==", false)
    .orderBy("updatedAt", "desc");

  const completedEventsSnap = await completedEventsRef.get();
  const incompleteEventsSnap = await incompleteEventsRef.get();

  const formattedCompletedEvents = completedEventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...formatEventData(doc.data()),
  }));

  const formattedIncompleteEvents = incompleteEventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...formatEventData(doc.data()),
  }));

  allEvents.push(...formattedIncompleteEvents, formattedCompletedEvents);
  return allEvents;
}

// Get a sublist (owners and collaborators only)
router.get(
  "/users/:userId/bucketList/subBucketLists/:sublistId",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    try {
      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
      const events = await getAllEventsFormatted(userId, sublistId); // Returns array of event objects
      const formatted = formatSublistData(docSnap.data());
      return res.json({ sublistData: formatted, goalData: events });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
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
      await docSnap.ref.update({
        ...req.body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return res.json({
        success: true,
        message: "Sublist updated successfully",
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Delete a sublist (owners only)
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

      const batch = db.batch();

      // Delete all goals under this sublist
      const eventsSnap = await docSnap.ref.collection("events").get();

      // Delete all documents in the events collection
      eventsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));

      // Delete sublist document
      batch.delete(docSnap.ref);

      // Commit the batch
      await batch.commit();

      await updateOverallStats(userId);

      return res.json({
        success: true,
        message: "Sublist deleted successfully",
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Add a goal (owners and collaborators only)
router.post(
  "/user/:userId/bucketList/subBucketLists/:sublistId/events",
  async (req, res) => {
    const { userId, sublistId } = req.params;
    const { title, description, categories, deadline, collaborators } =
      req.body;

    try {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      const newEventRef = db
        .collection("users")
        .doc(ownerId)
        .collection("bucketList")
        .doc(sublistId)
        .collection("events")
        .doc();

      const eventData = {
        title,
        description,
        categories,
        collaborators,
        isCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // deadline is optional
      if (deadline) {
        eventData.deadline = Timestamp.fromDate(deadline); // `deadline` is a JS Date
      }

      await newEventRef.set(eventData);

      // Use transaction to update sublist completion status
      // to ensure atomicity and prevent race conditions
      await db.runTransaction(async (transaction) => {
        const completionStatus = docSnap.data().completionStatus || [0, 0]; // default fallback set

        transaction.update(docSnap.ref, {
          completionStatus: [completionStatus[0], completionStatus[1] + 1],
        });
      });

      return res.json({ success: true, id: newEventRef.id });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

export default router;
