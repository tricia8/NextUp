import { Router } from "express";
import db from "../app.js";
import { FieldValue } from "firebase-admin/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

const router = Router();

// Invite collaborators as an owner
router.patch("/users/:userId/bucketList/:sublistId", async (req, res) => {
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

      const collaborators = docSnap.data().collaborators;

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
});

// Remove collaborator as an owner
router.delete("/users/:userId/bucketList/:sublistId", async (req, res) => {
  const { userId, sublistId } = req.params; // userId should be the owner of the sublist
  const { collaboratorId } = req.body; // userId of collaborator to remove
  try {
    await db.runTransaction(async (transaction) => {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      if (ownerId !== userId) {
        const err = new Error("Only the owner can remove collaborators");
        err.status = 403; // Permission denied
        throw err;
      }

      const collaborators = docSnap.data().collaborators;

      // Prevent duplicates
      if (!collaborators.includes(collaboratorId)) {
        throw new Error("User is not a collaborator");
      }

      transaction.update(docSnap.ref, {
        collaborators: collaborators.filter((id) => id !== collaboratorId),
      });

      // Update collaborators array for all goals under this sublist
      const eventsSnap = await docSnap.ref.collection("events").get();
      eventsSnap.docs.forEach((eventDoc) => {
        const eventCollaborators = eventDoc.data().collaborators;
        if (eventCollaborators.includes(collaboratorId)) {
          transaction.update(eventDoc.ref, {
            collaborators: eventCollaborators.filter(
              (id) => id !== collaboratorId
            ),
          });
        }
      });

      // Remove document from sharedSublists for the collaborator
      const shareSublistDocRef = await db
        .collection("users")
        .doc(collaboratorId)
        .collection("sharedSublists")
        .doc(sublistId)
        .get();

      if (shareSublistDocRef.exists) {
        transaction.delete(shareSublistDocRef.ref);
      }
    });

    // Update overall stats for removed collaborator
    await updateOverallStats(collaboratorId);

    return res.json({
      success: true,
      message: "Collaborator removed",
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Self-remove collaborator status (not owner)
router.delete("/users/:userId/bucketList/:sublistId", async (req, res) => {
  const { userId, sublistId } = req.params;
  const { collaboratorId } = req.body; // userId of collaborator to remove
  try {
    if (userId !== collaboratorId) {
      const err = new Error("You can only remove yourself as a collaborator");
      err.status = 403; // Permission denied
      throw err;
    }

    await db.runTransaction(async (transaction) => {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      if (ownerId == userId) {
        const err = new Error(
          "You are the owner, delete the sublist if you wish to revoke your access rights"
        );
        err.status = 403; // Permission denied
        throw err;
      }

      const collaborators = docSnap.data().collaborators;

      // Prevent duplicates
      if (!collaborators.includes(collaboratorId)) {
        throw new Error("You are not a collaborator");
      }

      transaction.update(docSnap.ref, {
        collaborators: collaborators.filter((id) => id !== collaboratorId),
      });

      // Update collaborators array for all goals under this sublist
      const eventsSnap = await docSnap.ref.collection("events").get();
      eventsSnap.docs.forEach((eventDoc) => {
        const eventCollaborators = eventDoc.data().collaborators;
        if (eventCollaborators.includes(collaboratorId)) {
          transaction.update(eventDoc.ref, {
            collaborators: eventCollaborators.filter(
              (id) => id !== collaboratorId
            ),
          });
        }
      });

      // Remove document from sharedSublists for the collaborator
      const shareSublistDocRef = await db
        .collection("users")
        .doc(collaboratorId)
        .collection("sharedSublists")
        .doc(sublistId)
        .get();

      if (shareSublistDocRef.exists) {
        transaction.delete(shareSublistDocRef.ref);
      }
    });

    // Update overall stats for removed collaborator
    await updateOverallStats(collaboratorId);

    return res.json({
      success: true,
      message: "Revoked collaborator status",
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

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

// convert Timestamp to string e.g. "3 days ago (14 Jun 2025)"
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

// Get all sublists for a user (both owned and shared)
router.get("/users/:userId/bucketList", async (req, res) => {
  const { userId } = req.params;
  try {
    const allSublists = await db
      .collectionGroup("bucketList")
      .where("collaborators", "array-contains", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const formattedSublists = allSublists.docs.map((doc) => ({
      id: doc.id,
      ...formatSublistData(doc.data()),
    }));

    return res.json(formattedSublists);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get only shared sublists (not owned)
router.get("/users/:userId/sharedSublists", async (req, res) => {
  const { userId } = req.params;
  try {
    const sharedListsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("sharedSublists")
      .get();

    const sharedSublists = await Promise.all(
      sharedListsSnap.docs.map(async (doc) => {
        const sublistId = doc.data().sublistId;
        const ownerId = doc.data().ownerId;
        const { docSnap } = await getSublistDocOrThrow(ownerId, sublistId);
        return {
          id: doc.id,
          updatedAtDate: docSnap.data().updatedAt.toDate(),
          ...formatSublistData(docSnap.data()),
        };
      })
    );

    return res.json(
      sharedSublists.sort((a, b) => {
        a.updatedAtDate > b.updatedAtDate ? -1 : 1; // sort by most recently updated
      })
    );
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get only owned sublists
router.get("/users/:userId/bucketList/owned", async (req, res) => {
  const { userId } = req.params;
  try {
    const bucketListSnap = await db
      .collection("users")
      .doc(userId)
      .collection("bucketList")
      .orderBy("updatedAt", "desc")
      .get();

    const ownedSublists = bucketListSnap.docs
      .filter((doc) => doc.id !== "stats")
      .map((doc) => ({
        id: doc.id,
        ...formatSublistData(doc.data()),
      }));

    return res.json(ownedSublists);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get a sublist (owners and collaborators only)
router.get("/users/:userId/bucketList/:sublistId", async (req, res) => {
  const { userId, sublistId } = req.params;
  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
    const events = await getAllEventsFormatted(userId, sublistId); // Returns array of event objects
    const formatted = formatSublistData(docSnap.data());
    return res.json({ sublistData: formatted, goalData: events });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Update a sublist (owners and collaborators only)
router.patch("/users/:userId/bucketList/:sublistId", async (req, res) => {
  const { userId, sublistId } = req.params;
  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
    await docSnap.ref.update({
      ...req.body,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return res.json({
      success: true,
      message: "Sublist updated successfully",
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Delete a sublist (only owner has permission)
router.delete("/users/:userId/bucketList/:sublistId", async (req, res) => {
  const { userId, sublistId } = req.params;
  try {
    const { docSnap, ownerId } = await getSublistDocOrThrow(userId, sublistId);

    if (ownerId !== userId) {
      const err = new Error("Only the owner can delete this sublist");
      err.status = 403; // Permission denied
      throw err;
    }

    const batch = db.batch();

    // Delete all goals and posts under this sublist
    const eventsSnap = await docSnap.ref.collection("events").get();
    // Delete all documents in the events collection
    for (const eventDoc of eventsSnap.docs) {
      // Delete all posts under this goal
      const postsSnap = await eventDoc.ref.collection("posts").get();
      postsSnap.docs.forEach((postSnap) => batch.delete(postSnap.ref));
      batch.delete(eventDoc.ref);
    }

    // Delete sublist document
    batch.delete(docSnap.ref);

    // Commit the batch
    await batch.commit();

    const deletePromises = docSnap
      .data()
      .collaborators.map((collaboratorId) =>
        updateOverallStats(collaboratorId)
      );

    await Promise.all(deletePromises);
    console.log(`Updated overall stats for collaborators`);

    return res.json({
      success: true,
      message: "Sublist deleted successfully",
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
