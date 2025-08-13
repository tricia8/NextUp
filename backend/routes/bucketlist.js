import { Router } from "express";
import db from "../app.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

const router = Router();

// Get sublist invites
router.get("/sublists/invites", async (req, res) => {
  const authUserId = req.user;

  try {
    const listInvitesRef = db.collection("listInvites");
    const snapshot = await listInvitesRef
      .where("receiverId", "==", authUserId)
      .get();

    const invites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return res.status(500).json({ error: "Failed to fetch list invites" });
  }
});

// Delete sublist invite
router.delete("/listInvites/:requestId/delete", async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).json({ error: "Missing request ID" });
  }

  try {
    const inviteRef = db.collection("listInvites").doc(requestId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return res
        .status(200)
        .json({ message: "Invite already deleted or not found" });
    }

    await inviteRef.delete();

    return res.status(200).json({ message: "Invite deleted successfully" });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return res.status(500).json({ error: "Failed to delete invite" });
  }
});

// Invite collaborators as an owner
router.post(
  "/user/bucketList/:sublistId/collaborators/:collaboratorId",
  async (req, res) => {
    const { sublistId, collaboratorId } = req.params;
    const userId = req.user; // Verified from middleware, userId should be the owner of the sublist

    console.log(
      `Inviting collaborator ${collaboratorId} to sublist ${sublistId} by ${userId}`
    );

    let invite;
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

        const ownerDataSnap = await transaction.get(
          db.collection("users").doc(ownerId)
        );
        const inviteeDataSnap = await transaction.get(
          db.collection("users").doc(collaboratorId)
        );
        const eventsSnap = await transaction.get(
          docSnap.ref.collection("events")
        );

        const collaborators = docSnap.data().collaborators;
        const createdAt = docSnap.data().createdAt; // Timestamp
        const updatedAt = docSnap.data().updatedAt; // Timestamp

        // Prevent duplicates
        if (collaborators.includes(collaboratorId)) {
          throw new Error("Invitee is already a collaborator");
        }

        transaction.update(docSnap.ref, {
          collaborators: [...collaborators, collaboratorId], // Array of userIds
        });

        // Update collaborators array for all goals under this sublist
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
          createdAt: createdAt, // Timestamp object
          updatedAt: updatedAt, // Timestamp object
        });

        const invitationDocRef = db.collection("listInvites").doc();

        transaction.set(invitationDocRef, {
          senderId: ownerId,
          receiverId: collaboratorId,
          senderName: ownerDataSnap.data()?.username,
          receiverName: inviteeDataSnap.data()?.username,
          sublistId,
          sentAt: FieldValue.serverTimestamp(),
          status: "unread",
        });
        invite = invitationDocRef.id; // ID of created invitation doc
      });

      // Update overall stats for new collaborator
      await updateOverallStats(collaboratorId);

      return res.json({
        success: true,
        message: "Collaborator added",
        invite,
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Remove collaborator as an owner
router.delete(
  "/user/bucketList/:sublistId/collaborators/:collaboratorId",
  async (req, res) => {
    const { sublistId, collaboratorId } = req.params; // userId should be the owner of the sublist
    const userId = req.user; // Verified from middleware

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

        // Remove invitations for this collaborator
        const invitesSnap = await db
          .collection("listInvites")
          .where("receiverId", "==", collaboratorId)
          .where("sublistId", "==", sublistId)
          .get();

        invitesSnap.forEach((inviteDoc) => {
          transaction.delete(inviteDoc.ref);
        });
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
  }
);

// Self-remove collaborator status (not owner)
// Patch method as user is patching their access rights (e.g. removing their UID collaborators array)
router.patch(
  "/user/bucketList/:sublistId/collaborators/:collaboratorId",
  async (req, res) => {
    const { sublistId, collaboratorId } = req.params;
    const userId = req.user; // Verified from middleware

    // const { collaboratorId } = req.body; // userId of collaborator to remove
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

        // Remove invitations for this collaborator
        const invitesSnap = await db
          .collection("listInvites")
          .where("receiverId", "==", collaboratorId)
          .where("sublistId", "==", sublistId)
          .get();

        invitesSnap.forEach((inviteDoc) => {
          transaction.delete(inviteDoc.ref);
        });
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
  }
);

// Helper function
const formatSublistData = (data) => {
  // data type: Sublist object
  const updatedAt = data.updatedAt?.toDate?.();
  const createdAt = data.createdAt?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    accessLevel: data.accessLevel,
    collaborators: data.collaborators,
    ownerId: data.ownerId, // owner of the sublist
    updatedAt: updatedAt ? formatDisplayDate(updatedAt) : "",
    updatedAtRaw: data.updatedAt, // Timestamp object
    createdAt: createdAt ? formatDisplayDate(createdAt) : "",
    createdAtRaw: data.createdAt, // Timestamp object
    completionStatus: data.completionStatus,
  };
};

// convert Timestamp to string e.g. "3 days ago (14 Jun 2025)"
const formatDisplayDate = (fetchedDate) => {
  return `${dayjs(fetchedDate).fromNow()} (${dayjs(fetchedDate).format(
    "DD MMM YYYY"
  )})`;
};

// lightweight function to get ownerId for frontend onSnapshot setup
const getSublistOwnerOrThrow = async (userId, sublistId) => {
  const sublistRef = db
    .collection("users")
    .doc(userId)
    .collection("bucketList")
    .doc(sublistId);

  const sublistSnap = await sublistRef.get();
  if (sublistSnap.exists) {
    return userId; // user is owner
  }

  // check shared sublist reference
  const sharedSublistRef = db
    .collection("users")
    .doc(userId)
    .collection("sharedSublists")
    .doc(sublistId);

  const sharedSnap = await sharedSublistRef.get();
  if (!sharedSnap.exists) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  const { ownerId } = sharedSnap.data() || {};
  if (!ownerId) {
    const err = new Error("Malformed sharedSublist entry: missing ownerId");
    err.status = 500;
    throw err;
  }

  return ownerId;
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
    console.log("Found as owner:", userId);
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
  console.log("Shared doc found. ownerId from sharedDocSnap:", ownerId);

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

  const sublistData = ownerSublistSnap.data();

  // Remove stale sharedSublist if no longer a collaborator
  if (
    sublistData.collaborators &&
    !sublistData.collaborators.includes(userId)
  ) {
    await sharedSublistDocRef.delete();
    const err = new Error("Access denied: You are no longer a collaborator.");
    err.status = 403;
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

// Get user stats
router.get("/user/:userId/bucketList/stats", async (req, res) => {
  const { userId } = req.params;

  try {
    const statsRef = db
      .collection("users")
      .doc(userId)
      .collection("bucketList")
      .doc("stats");
    const docSnapshot = await statsRef.get();

    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      return res.json({
        totalEvents: data.totalEvents,
        completedEvents: data.completedEvents,
      });
    } else {
      return res.json({ totalEvents: 0, completedEvents: 0 });
    }
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get all sublists for a user (both owned and shared)
router.get("/user/bucketList", async (req, res) => {
  const userId = req.user; // Verified from middleware
  try {
    const allSublists = await db
      .collectionGroup("bucketList")
      .where("collaborators", "array-contains", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const formattedSublists = allSublists.docs.map((doc) => ({
      id: doc.id,
      ...formatSublistData(doc.data()), // includes ownerId
    }));

    return res.json(formattedSublists);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get only shared sublists (not owned)
router.get("/user/sharedSublists", async (req, res) => {
  const userId = req.user; // Verified from middleware
  try {
    const sharedListsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("sharedSublists")
      .orderBy("updatedAt", "desc")
      .get();

    const sharedSublists = await Promise.all(
      sharedListsSnap.docs.map(async (doc) => {
        const sublistId = doc.id;
        // const ownerId = doc.data().ownerId;
        try {
          const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
          return {
            id: doc.id,
            // updatedAtDate: docSnap.data().updatedAt.toDate(),
            ...formatSublistData(docSnap.data()), // with updatedAtRaw and createdAtRaw
          };
        } catch (err) {
          if (err.status === 403) {
            // Skip stale shared sublists silently
            console.warn(`Skipping stale shared sublist: ${sublistId}`);
            return null;
          }
          // For other errors (e.g. DB issues), fail fast
          throw err;
        }
      })
    );

    return res.json(
      /* sharedSublists.sort((a, b) => {
        a.updatedAtRaw.toMillis() > b.updatedAtRaw.toMillis() ? -1 : 1; // sort by most recently updated
      }) */
      sharedSublists.filter(Boolean) // remove null entries
    );
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get only owned sublists
router.get("/user/bucketList/owned", async (req, res) => {
  const userId = req.user; // Verified from middleware
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

// Create a new sublist
router.post("/user/bucketList", async (req, res) => {
  const userId = req.user; // Verified from middleware
  const { title, description, accessLevel, collaborators } = req.body;

  try {
    if (!title || !accessLevel) {
      const err = new Error("Title and access level are required");
      err.status = 400; // Bad request
      throw err;
    }

    if (!Array.isArray(collaborators) || collaborators.length === 0) {
      const err = new Error("Collaborators must be a non-empty array");
      err.status = 400; // Bad request
      throw err;
    }

    if (!collaborators.includes(userId)) {
      const err = new Error(
        "You must be a collaborator on the sublist you're creating"
      );
      err.status = 400; // Bad request
      throw err;
    }

    const timestamp = FieldValue.serverTimestamp();

    const sublistRef = await db
      .collection("users")
      .doc(userId)
      .collection("bucketList")
      .add({
        title,
        description,
        accessLevel,
        collaborators, // array of userIds
        ownerId: userId, // owner of the sublist
        createdAt: timestamp,
        updatedAt: timestamp,
        completionStatus: [0, 0],
      });

    const ownerDataSnap = await db.collection("users").doc(userId).get();

    // Add to sharedSublists for all collaborators except for the owner
    const batch = db.batch();
    const filteredCollaborators = collaborators.filter(
      (collaboratorId) => collaboratorId !== userId
    );

    for (const collaboratorId of filteredCollaborators) {
      const sharedSublistDocRef = db
        .collection("users")
        .doc(collaboratorId)
        .collection("sharedSublists")
        .doc(sublistRef.id);

      // Add to listInvites for all collaborators except for the owner
      const invitationDocRef = db.collection("listInvites").doc();

      const inviteeDataSnap = await db
        .collection("users")
        .doc(collaboratorId)
        .get();

      batch.set(sharedSublistDocRef, {
        ownerId: userId,
        permissions: "write",
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      batch.set(invitationDocRef, {
        senderId: userId,
        receiverId: collaboratorId,
        senderName: ownerDataSnap.data()?.username,
        receiverName: inviteeDataSnap.data()?.username,
        sublistId: sublistRef.id,
        sentAt: FieldValue.serverTimestamp(),
        status: "unread",
      });
    }

    await batch.commit();

    const sublistDataSnap = await sublistRef.get();
    const sublistData = formatSublistData(sublistDataSnap.data());

    return res.json({
      success: true,
      message: "New sublist added",
      sublistId: sublistRef.id,
      sublistData,
      ownerId: userId,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get sublist ownerId (for frontend onSnapshot setup)
router.get("/user/bucketList/:sublistId/owner", async (req, res) => {
  const userId = req.user; // Verified from auth middleware
  const { sublistId } = req.params;

  try {
    const ownerId = await getSublistOwnerOrThrow(userId, sublistId);
    return res.json({ ownerId });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get a sublist (owners and collaborators only)
router.get("/user/bucketList/:sublistId", async (req, res) => {
  const { sublistId } = req.params;
  const userId = req.user; // Verified from middleware

  try {
    const { docSnap, ownerId } = await getSublistDocOrThrow(userId, sublistId);
    const events = await getAllEventsFormatted(userId, sublistId); // Returns array of event objects
    const formatted = formatSublistData(docSnap.data());
    console.log("Owner ID: ", ownerId);
    return res.json({
      ownerId,
      sublistData: formatted,
      goalData: events,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get sublists filtered by access levels
router.get("/filteredSublists", async (req, res) => {
  const { userId } = req.query;
  const { accessLevels } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing 'userId' query parameter" });
  }

  if (!accessLevels) {
    return res
      .status(400)
      .json({ error: "Missing 'accessLevels' query parameter" });
  }

  try {
    const accessLevelArray = Array.isArray(accessLevels)
      ? accessLevels
      : accessLevels.split(",");

    const q = db
      .collectionGroup("bucketList")
      .where("collaborators", "array-contains", userId)
      .where("accessLevel", "in", accessLevelArray);

    const snapshot = await q.get();

    const sublists = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description ?? "",
        accessLevel: data.accessLevel,
        collaborators: data.collaborators,
        createdAt: data.createdAt,
        ownerId: data.ownerId,
      };
    });

    return res.status(200).json({ sublists });
  } catch (error) {
    console.error("Error fetching sublists:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update a sublist (owners and collaborators only)
router.patch("/user/bucketList/:sublistId", async (req, res) => {
  const { sublistId } = req.params;
  const userId = req.user; // Verified from middleware

  const forbiddenFields = ["ownerId", "createdAt", "collaborators"];
  for (const field of forbiddenFields) {
    if (field in req.body) {
      return res.status(400).json({
        error: `Updating "${field}" is not allowed.`,
      });
    }
  }

  try {
    const { docSnap, ownerId } = await getSublistDocOrThrow(userId, sublistId);

    const timestamp = FieldValue.serverTimestamp();
    await docSnap.ref.update({
      ...req.body,
      updatedAt: timestamp,
    });

    // Update updatedAt for collaborators' doc in sharedSublists
    const collaborators = docSnap
      .data()
      .collaborators.filter((id) => id !== ownerId);
    const batch = db.batch();
    collaborators.forEach((collaboratorId) => {
      const sharedListRef = db
        .collection("users")
        .doc(collaboratorId)
        .collection("sharedSublists")
        .doc(sublistId);
      batch.update(sharedListRef, { updatedAt: timestamp });
    });

    await batch.commit();

    // Refetch the updated sublist
    const updatedSnap = await docSnap.ref.get();
    const formatted = formatSublistData(updatedSnap.data());

    return res.json({
      success: true,
      message: "Sublist updated successfully",
      sublistData: formatted,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Delete a sublist (only owner has permission)
router.delete("/user/bucketList/:sublistId", async (req, res) => {
  const { sublistId } = req.params;
  const userId = req.user; // Verified from middleware

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

    docSnap
      .data()
      .collaborators.filter((id) => id !== ownerId)
      .forEach((collaboratorId) => {
        // Remove document from sharedSublists for each collaborator
        const sharedListRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistId);
        batch.delete(sharedListRef);
      });

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

// Events

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

  allEvents.push(...formattedIncompleteEvents, ...formattedCompletedEvents);
  return allEvents;
}

// Get all events of given sublists
router.post("/sublists/allEvents", async (req, res) => {
  const { uid, subBucketLists } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "Missing 'uid' in request body" });
  }

  if (!Array.isArray(subBucketLists)) {
    return res
      .status(400)
      .json({ error: "subBucketLists must be an array of IDs" });
  }

  try {
    const allEvents = [];

    for (const sub of subBucketLists) {
      const eventsRef = db
        .collection("users")
        .doc(sub.ownerId)
        .collection("bucketList")
        .doc(sub.id)
        .collection("events");

      const eventsSnap = await eventsRef.get();

      const events = eventsSnap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            sublistId: sub.id,
            ownerId: data.ownerId,
            title: data.title,
            description: data.description,
            categories: data.categories,
            isCompleted: data.isCompleted,
            deadline: data.deadline,
            createdAt: data.createdAt,
          };
        })
        .filter((event) => event.isCompleted);

      allEvents.push(...events);
    }

    return res.status(200).json({ events: allEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get upcoming events
router.post("/events/upcoming", async (req, res) => {
  const authUserId = req.user;
  const { uid, now } = req.body;

  if (!uid || !now) {
    return res
      .status(400)
      .json({ error: "'uid' and 'now' are required in request body" });
  }

  if (authUserId !== uid) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const q = db
      .collectionGroup("events")
      .where("collaborators", "array-contains", authUserId)
      .where("deadline", ">=", Timestamp.fromDate(new Date(now)))
      .where("isCompleted", "==", false)
      .orderBy("deadline")
      .limit(3);

    const snapshot = await q.get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...formatEventData(doc.data()),
    }));

    return res.json({ events });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// Get overdue events
router.post("/events/overdue", async (req, res) => {
  const authUserId = req.user;
  const { uid, now } = req.body;

  if (!uid || !now) {
    return res
      .status(400)
      .json({ error: "'uid' and 'now' are required in request body" });
  }

  if (authUserId !== uid) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const q = db
      .collectionGroup("events")
      .where("collaborators", "array-contains", authUserId)
      .where("deadline", "<", Timestamp.fromDate(new Date(now)))
      .where("isCompleted", "==", false);

    const snapshot = await q.get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...formatEventData(doc.data()),
    }));

    return res.json({ events });
  } catch (err) {
    console.error("Error fetching overdue events:", err);
    return res.status(500).json({ error: "Failed to fetch overdue events" });
  }
});

// Add a goal (owners and collaborators only)
router.post("/user/bucketList/:sublistId/events", async (req, res) => {
  const { sublistId } = req.params;
  const { title, description, categories, deadline, collaborators } = req.body;
  const userId = req.user; // Verified from middleware

  try {
    const { docSnap, ownerId } = await getSublistDocOrThrow(userId, sublistId);

    const newEventRef = docSnap.ref.collection("events").doc();

    const timestamp = FieldValue.serverTimestamp();

    const eventData = {
      title,
      description,
      categories,
      collaborators,
      isCompleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // deadline is optional
    if (deadline) {
      const deadlineDate = new Date(deadline);
      eventData.deadline = Timestamp.fromDate(deadlineDate);
    }

    await newEventRef.set(eventData);

    // Use transaction to update sublist completion status
    // to ensure atomicity and prevent race conditions
    await db.runTransaction(async (transaction) => {
      const completionStatus = docSnap.data().completionStatus || [0, 0]; // default fallback set

      transaction.update(docSnap.ref, {
        updatedAt: timestamp,
        completionStatus: [completionStatus[0], completionStatus[1] + 1],
      });

      // Update updatedAt for collaborators' doc in sharedSublists
      const collaborators = docSnap
        .data()
        .collaborators.filter((id) => id !== ownerId);

      collaborators.forEach((collaboratorId) => {
        const sharedListRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistId);
        transaction.update(sharedListRef, { updatedAt: timestamp });
      });
    });

    // Update overall stats for all collaborators
    const deletePromises = docSnap
      .data()
      .collaborators.map((collaboratorId) =>
        updateOverallStats(collaboratorId)
      );

    await Promise.all(deletePromises);
    console.log(`Updated overall stats for collaborators`);

    return res.json({ success: true, id: newEventRef.id });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// convert Timestamp to string e.g. "4 June 2025, 10:12am"
const formatPostDate = (fetchedDate) => {
  const date = dayjs(fetchedDate);
  return `${date.format("DD MMM YYYY")}, ${date.format("h:mma")}`;
};

const formatPostData = (data) => {
  const createdAt = data.createdAt?.toDate?.();
  const updatedAt = data.updatedAt?.toDate?.();

  return {
    userId: data.userId,
    username: data.username,
    profilePhotoUrl: data.profilePhotoUrl,
    createdAt: createdAt ? formatPostDate(createdAt) : "",
    updatedAt: updatedAt ? formatPostDate(updatedAt) : "",
    comment: data.comment ?? "", // default to empty string
    images: data.images ?? [], // default to empty array
  };
};

// Fetch individual goal details (owners and collaborators only)
router.get("/user/bucketList/:sublistId/events/:eventId", async (req, res) => {
  const { sublistId, eventId } = req.params;
  const userId = req.user; // Verified from middleware

  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

    const eventDocsSnap = await docSnap.ref
      .collection("events")
      .doc(eventId)
      .get();
    if (!eventDocsSnap.exists) {
      const err = new Error("Event not found");
      err.status = 404;
      throw err;
    }

    const formattedEventData = formatEventData(eventDocsSnap.data());

    // Fetch all posts under this goal
    const postsSnap = await eventDocsSnap.ref
      .collection("posts")
      .orderBy("createdAt", "desc")
      .get();

    const formattedPosts = postsSnap.docs.map((doc) => ({
      id: doc.id,
      ...formatPostData(doc.data()),
    }));

    return res.json({
      goalData: formattedEventData,
      posts: formattedPosts,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Update goal metadata (owners and collaborators only), excluding post content
router.patch(
  "/user/bucketList/:sublistId/events/:eventId",
  async (req, res) => {
    const { sublistId, eventId } = req.params;
    const userId = req.user; // Verified from middleware

    try {
      let completionStatusChanged = false;

      await db.runTransaction(async (transaction) => {
        const { docSnap, ownerId } = await getSublistDocOrThrow(
          userId,
          sublistId
        );

        const eventDocRef = docSnap.ref.collection("events").doc(eventId);
        const eventDocSnap = await transaction.get(eventDocRef);

        if (!eventDocSnap.exists) {
          const err = new Error("Event not found");
          err.status = 404;
          throw err;
        }

        const isEventCompleted = eventDocSnap.data().isCompleted;

        const updateData = { ...req.body };
        const timestamp = FieldValue.serverTimestamp();

        // Handle deadline conversion
        if (updateData.deadline) {
          const deadlineDate = new Date(updateData.deadline);
          updateData.deadline = Timestamp.fromDate(deadlineDate);
        }

        if (
          updateData.isCompleted !== undefined &&
          updateData.isCompleted !== isEventCompleted
        ) {
          // Completion status has changed, update sublist completion status and overall stats
          completionStatusChanged = true;

          const [completed, total] = docSnap.data().completionStatus || [0, 0];
          const updatedStatus = !isEventCompleted
            ? [completed + 1, total]
            : [Math.max(0, completed - 1), total]; // avoid negative values

          // Update sublist
          transaction.update(docSnap.ref, {
            completionStatus: updatedStatus,
          });
        }

        // Update event document
        transaction.update(eventDocRef, {
          ...updateData,
          updatedAt: timestamp,
        });

        // Update sublist updatedAt timestamp
        transaction.update(docSnap.ref, {
          updatedAt: timestamp,
        });

        // Update updatedAt for collaborators' doc in sharedSublists
        const collaborators = docSnap
          .data()
          .collaborators.filter((id) => id !== ownerId);

        collaborators.forEach((collaboratorId) => {
          const sharedListRef = db
            .collection("users")
            .doc(collaboratorId)
            .collection("sharedSublists")
            .doc(sublistId);
          transaction.set(
            sharedListRef,
            { updatedAt: timestamp },
            { merge: true }
          );
        });
      });

      // Fetch updated event data after the transaction
      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
      const updatedEventDoc = await docSnap.ref
        .collection("events")
        .doc(eventId)
        .get();
      const formattedEventData = formatEventData(updatedEventDoc.data());

      // Update overall stats if completion status changed
      if (completionStatusChanged) {
        const deletePromises = docSnap
          .data()
          .collaborators.map((collaboratorId) =>
            updateOverallStats(collaboratorId)
          );

        await Promise.all(deletePromises);
        console.log(`Updated overall stats for collaborators`);
      }

      /* return res.json({
        success: true,
        message: "Event updated successfully",
      }); */

      return res.json(formattedEventData);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Delete a goal on [sublist] screen (owners and collaborators only)
router.delete(
  "/user/bucketList/:sublistId/events/:eventId",
  async (req, res) => {
    const { sublistId, eventId } = req.params;
    const userId = req.user; // Verified from middleware

    try {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      const eventDocRef = docSnap.ref.collection("events").doc(eventId);

      const batch = db.batch();

      // Delete all posts under this goal
      const postsSnap = await eventDocRef.collection("posts").get();
      postsSnap.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete the goal document
      batch.delete(eventDocRef);

      // Before committing the batch, update sublist's completion status and overall stats
      await db.runTransaction(async (transaction) => {
        const sublistSnap = await transaction.get(docSnap.ref);
        const eventSnap = await transaction.get(eventDocRef); // Fetch event document to check completion status

        if (!eventSnap.exists) {
          const err = new Error("Event not found");
          err.status = 404;
          throw err;
        }

        const isCompleted = eventSnap.data().isCompleted;
        const completionStatus = sublistSnap.data().completionStatus || [0, 0]; // default fallback set

        const [completed, total] = completionStatus;

        // avoid negative values
        const updatedStatus = isCompleted
          ? [Math.max(0, completed - 1), Math.max(0, total - 1)]
          : [completed, Math.max(0, total - 1)];

        const timestamp = FieldValue.serverTimestamp();

        transaction.update(docSnap.ref, {
          completionStatus: updatedStatus,
          updatedAt: timestamp,
        });

        // Update updatedAt for collaborators' doc in sharedSublists
        const collaborators = docSnap
          .data()
          .collaborators.filter((id) => id !== ownerId);

        collaborators.forEach((collaboratorId) => {
          const sharedListRef = db
            .collection("users")
            .doc(collaboratorId)
            .collection("sharedSublists")
            .doc(sublistId);
          transaction.update(sharedListRef, { updatedAt: timestamp });
        });

        console.log(`Updated sublist ${sublistId}`);
      });

      await batch.commit();

      // Update overall stats for all collaborators
      const deletePromises = docSnap
        .data()
        .collaborators.map((collaboratorId) =>
          updateOverallStats(collaboratorId)
        );

      await Promise.all(deletePromises);
      console.log(`Updated overall stats for collaborators`);

      return res.json({
        success: true,
        message: "Goal and its posts deleted successfully",
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Toggle event completion
router.patch(
  "/user/bucketList/:sublistId/events/:eventId/toggleCompletion",
  async (req, res) => {
    const { sublistId, eventId } = req.params;
    const userId = req.user;

    try {
      await db.runTransaction(async (transaction) => {
        const { docSnap, ownerId } = await getSublistDocOrThrow(
          userId,
          sublistId
        );

        const eventDocRef = docSnap.ref.collection("events").doc(eventId);

        const eventSnap = await transaction.get(eventDocRef);

        if (!eventSnap.exists) {
          throw new Error("Event not found");
        }

        const currentCompleted = eventSnap.data().isCompleted;
        const [completed, total] = docSnap.data().completionStatus || [0, 0];
        const updatedStatus = !currentCompleted
          ? [completed + 1, total]
          : [Math.max(0, completed - 1), total]; // avoid negative values

        const timestamp = FieldValue.serverTimestamp();

        // update event
        transaction.update(eventDocRef, {
          isCompleted: !currentCompleted,
          updatedAt: timestamp,
        });

        // update subBucketList completionStatus
        transaction.update(docSnap.ref, {
          completionStatus: updatedStatus,
          updatedAt: timestamp,
        });

        // update updatedAt for collaborators' doc in sharedSublists
        const collaborators = docSnap
          .data()
          .collaborators.filter((id) => id !== ownerId);

        collaborators.forEach((collaboratorId) => {
          const sharedListRef = db
            .collection("users")
            .doc(collaboratorId)
            .collection("sharedSublists")
            .doc(sublistId);
          transaction.update(sharedListRef, { updatedAt: timestamp });
        });
      });

      await updateOverallStats(userId);

      return res
        .status(200)
        .json({ success: true, message: "Completion toggled" });
    } catch (error) {
      console.error("Error toggling event completion:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// Create a post under a goal
router.post(
  "/user/bucketList/:sublistId/events/:eventId/posts",
  async (req, res) => {
    console.log("Incoming post body:", req.body);

    const { sublistId, eventId } = req.params;
    const userId = req.user; // Verified from middleware
    const { username, profilePhotoUrl, comment, images } = req.body;

    try {
      if (
        comment.trim() === "" &&
        (!Array.isArray(images) || images.length === 0)
      ) {
        const err = new Error("Comment or images must not be empty");
        err.status = 400; // Bad Request
        throw err;
      }

      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );

      const newPostRef = docSnap.ref
        .collection("events")
        .doc(eventId)
        .collection("posts")
        .doc();

      const timestamp = FieldValue.serverTimestamp();
      const postData = {
        userId,
        username,
        profilePhotoUrl,
        comment,
        images,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      console.log("Post data to be added:", postData);

      const batch = db.batch();
      batch.set(newPostRef, postData);
      // await newPostRef.set(postData);

      batch.update(docSnap.ref, {
        updatedAt: timestamp,
      });

      // update updatedAt for collaborators' doc in sharedSublists
      const collaborators = docSnap
        .data()
        .collaborators.filter((id) => id !== ownerId);

      for (const collaboratorId of collaborators) {
        const sharedListRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistId);
        batch.update(sharedListRef, { updatedAt: timestamp });
      }

      batch.update(docSnap.ref.collection("events").doc(eventId), {
        updatedAt: timestamp,
      });

      await batch.commit();

      console.log("New post written successfully:", newPostRef.id);

      const postSnap = await newPostRef.get();

      return res.json({
        success: true,
        message: "New post added",
        postData: { id: newPostRef.id, ...formatPostData(postSnap.data()) },
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Delete a post under a goal
router.delete(
  "/user/bucketList/:sublistId/events/:eventId/posts/:postId",
  async (req, res) => {
    const { sublistId, eventId, postId } = req.params;
    const userId = req.user; // Verified from middleware

    try {
      const { docSnap, ownerId } = await getSublistDocOrThrow(
        userId,
        sublistId
      );
      console.log("Sublist retrieved. Owner ID:", ownerId);

      const postDocRef = docSnap.ref
        .collection("events")
        .doc(eventId)
        .collection("posts")
        .doc(postId);

      const postSnap = await postDocRef.get();

      if (!postSnap.exists) {
        const err = new Error("Post not found");
        err.status = 404; // Not found
        throw err;
      }

      const postData = postSnap.data();

      if (postData.userId !== userId) {
        const err = new Error("Only the author can delete this post");
        err.status = 403; // Permission denied
        throw err;
      }
      const images = postData?.images || [];

      let message;
      let userMessage;

      // batch delete images from Cloudinary
      if (images.length > 0) {
        const cloudRes = await fetch(
          "https://nextup-l0e9.onrender.com/api/cloudinary/delete-images",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
            body: JSON.stringify({
              public_ids: images.map((img) => img?.publicId).filter(Boolean), // filter out undefined/null publicIds
            }),
          }
        );

        const cloudResult = await cloudRes.json();

        if (!cloudRes.ok || !cloudResult.success) {
          // Log failed deletions for developer alerting/monitoring
          console.warn(
            "Failed to delete some images from Cloudinary:",
            cloudResult.failed
          );

          message =
            "Post deleted. Some images could not be removed from Cloudinary.";

          userMessage =
            "Post deleted. Some images could not be removed from our server, but they are no longer visible in your account.";
        }
      }

      console.log("Attempting to delete post:", postDocRef.path);

      const batch = db.batch();

      // Delete post document in Firestore
      // await postDocRef.delete();
      batch.delete(postDocRef);

      console.log("Post document deleted from Firestore");

      const timestamp = FieldValue.serverTimestamp();

      // Update sublist and event updatedAt timestamps
      batch.update(docSnap.ref, {
        updatedAt: timestamp,
      });

      // update updatedAt for collaborators' doc in sharedSublists
      const collaborators = docSnap
        .data()
        .collaborators.filter((id) => id !== ownerId);

      for (const collaboratorId of collaborators) {
        const sharedListRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistId);
        batch.update(sharedListRef, { updatedAt: timestamp });
      }

      batch.update(docSnap.ref.collection("events").doc(eventId), {
        updatedAt: timestamp,
      });

      await batch.commit();

      // Return 200 to client if post was deleted successfully
      // but include metadata for UI/debugging (optional)
      return res.status(200).json({
        success: true,
        message: message ?? "Post deleted",
        userMessage: userMessage ?? "Post deleted!",
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Update a post under a goal
router.patch(
  "/user/bucketList/:sublistId/events/:eventId/posts/:postId",
  async (req, res) => {
    const { sublistId, eventId, postId } = req.params;
    const userId = req.user; // Verified from middleware
    const { comment, images } = req.body;

    try {
      if (
        comment.trim() === "" &&
        (!Array.isArray(images) || images.length === 0)
      ) {
        const err = new Error("Comment or images must not be empty");
        err.status = 400; // Bad Request
        throw err;
      }

      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

      const postDocRef = docSnap.ref
        .collection("events")
        .doc(eventId)
        .collection("posts")
        .doc(postId);

      const postSnap = await postDocRef.get();
      const postData = postSnap.data();

      if (postData.userId !== userId) {
        const err = new Error("Only the author can update this post");
        err.status = 403; // Permission denied
        throw err;
      }

      const oldImages = postData?.images || [];

      const imagesToDelete = Array.isArray(images)
        ? oldImages.filter(
            (oldImg) => !images.some((img) => img.publicId === oldImg.publicId)
          )
        : [];

      const timestamp = FieldValue.serverTimestamp();

      await postDocRef.update({
        comment,
        updatedAt: timestamp,
        images: images ?? oldImages, // Update images if provided, else keep existing ones
      });

      let message;

      // batch delete images from Cloudinary
      // NOTE: new images have already been uploaded to Cloudinary
      if (imagesToDelete.length > 0) {
        const cloudDelRes = await fetch(
          "https://nextup-l0e9.onrender.com/api/cloudinary/delete-images",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
            body: JSON.stringify({
              public_ids: imagesToDelete.map((img) => img.publicId),
            }),
          }
        );

        const cloudResult = await cloudDelRes.json();

        if (
          !cloudDelRes.ok ||
          !cloudResult.success ||
          cloudResult.failed?.length > 0
        ) {
          // Log failed deletions for developer alerting/monitoring
          console.warn(
            "Failed to delete some images from Cloudinary:",
            cloudResult.failed
          );

          message =
            "Post updated! Some images could not be removed from our server, but they are no longer visible in your account.";
        }
      }

      // Update timestamps for goal and sublist
      const batch = db.batch();

      batch.update(docSnap.ref, {
        updatedAt: timestamp,
      });

      batch.update(docSnap.ref.collection("events").doc(eventId), {
        updatedAt: timestamp,
      });

      await batch.commit();

      const updatedPostSnap = await postDocRef.get();

      return res.status(200).json({
        success: true,
        message: message || "Post updated!",
        postData: { id: postId, ...formatPostData(updatedPostSnap.data()) },
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

export default router;
