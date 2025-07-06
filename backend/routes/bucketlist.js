import { Router } from "express";
import db from "../app.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

const router = Router();

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
        });

        const invitationDocRef = db.collection("listInvites").doc();

        transaction.set(invitationDocRef, {
          senderId: ownerId,
          receiverId: collaboratorId,
          senderName: ownerDataSnap.data()?.username,
          receiverName: inviteeDataSnap.data()?.username,
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

router.get("/user/:userId/bucketList/stats", async (req, res) => {
  const { userId } = req.params;

  try {
    const statsRef = doc(db, "users", uid, "bucketList", "stats");
    const docSnapshot = getDoc(statsRef);

    if (docSnapshot.exists()) {
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
      ...formatSublistData(doc.data()),
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
      .get();

    const sharedSublists = await Promise.all(
      sharedListsSnap.docs.map(async (doc) => {
        const sublistId = doc.id;
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

    const sublistRef = await db
      .collection("users")
      .doc(userId)
      .collection("bucketList")
      .add({
        title,
        description,
        accessLevel,
        collaborators, // array of userIds
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        completionStatus: [0, 0],
      });

    // Add to sharedSublists for all collaborators except for the owner
    const batch = db.batch();
    collaborators
      .filter((collaboratorId) => collaboratorId !== userId)
      .forEach((collaboratorId) => {
        const sharedSublistDocRef = db
          .collection("users")
          .doc(collaboratorId)
          .collection("sharedSublists")
          .doc(sublistRef.id);

        batch.set(sharedSublistDocRef, {
          ownerId: userId,
          permissions: "write",
        });
      });

    await batch.commit();

    const sublistDataSnap = await sublistRef.get();
    const sublistData = formatSublistData(sublistDataSnap.data());

    return res.json({
      success: true,
      message: "Sublist created successfully",
      sublistId: sublistRef.id,
      sublistData,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get a sublist (owners and collaborators only)
router.get("/user/bucketList/:sublistId", async (req, res) => {
  const { sublistId } = req.params;
  const userId = req.user; // Verified from middleware

  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);
    const events = await getAllEventsFormatted(userId, sublistId); // Returns array of event objects
    const formatted = formatSublistData(docSnap.data());
    return res.json({ sublistData: formatted, goalData: events });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

// Get sublists filtered by access levels
router.get("/users/:userId/bucketList/filteredSublists", async (req, res) => {
  const { userId } = req.params;
  const { accessLevels } = req.query;

  if (!accessLevels) {
    return res
      .status(400)
      .json({ error: "Missing 'accessLevels' query parameter" });
  }

  try {
    const accessLevelArray = Array.isArray(accessLevels)
      ? accessLevels
      : accessLevels.split(",");

    const q = query(
      collectionGroup(db, "bucketList"),
      where("collaborators", "array-contains", userId),
      where("accessLevel", "in", accessLevelArray)
    );

    const sublists = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description ?? "",
        accessLevel: data.accessLevel,
        collaborators: data.collaborators,
        createdAt: data.createdAt,
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

  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

    await docSnap.ref.update({
      ...req.body,
      updatedAt: FieldValue.serverTimestamp(),
    });

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
router.post("/users/:userId/bucketList/allEvents", async (req, res) => {
  const { userId } = req.params;
  const { subBucketLists } = req.body;

  if (!Array.isArray(subBucketLists)) {
    return res.status(400).json({ error: 'subBucketLists must be an array of IDs' });
  }

  try {
    const allEvents = [];

    for (const sub of subBucketLists) {
      const eventsRef = collection(db, "users", userId, "bucketList", sub.id, "events");
      const eventsSnap = await getDocs(eventsRef);

      const events = eventsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ownerId: data.ownerId,
          title: data.title,
          description: data.description,
          categories: data.categories,
          isCompleted: data.completed,
          deadline: data.deadline,
          createdAt: data.createdAt,
        };
      });

      allEvents.push(...events);
    }

    return res.status(200).json({ events: allEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Add a goal (owners and collaborators only)
router.post("/user/bucketList/:sublistId/events", async (req, res) => {
  const { sublistId } = req.params;
  const { title, description, categories, deadline, collaborators } = req.body;
  const userId = req.user; // Verified from middleware

  try {
    const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

    const newEventRef = docSnap.ref.collection("events").doc();

    const eventData = {
      title,
      description,
      categories,
      collaborators,
      isCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
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
        updatedAt: FieldValue.serverTimestamp(),
        completionStatus: [completionStatus[0], completionStatus[1] + 1],
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
  return `${dayjs(fetchedDate).format("DD MMM YYYY")}, ${dayjs(
    fetchedDate
  ).format("h:mma")}`;
};

const formatPostData = (data) => {
  const createdAt = data.createdAt?.toDate?.();
  const updatedAt = data.updatedAt?.toDate?.();

  return {
    username: data.username,
    profilePhotoUrl: data.profilePhotoUrl,
    createdAt: createdAt ? formatPostDate(createdAt) : "",
    updatedAt: updatedAt ? formatPostDate(updatedAt) : "",
    comment: data.comment ?? "", // default to empty string
    imageUrl: data.imageUrl ?? "", // default to empty string
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
        const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

        const eventDocRef = docSnap.ref.collection("events").doc(eventId);
        const eventDocSnap = await eventDocRef.get();
        if (!eventDocSnap.exists) {
          const err = new Error("Event not found");
          err.status = 404;
          throw err;
        }

        const isEventCompleted = eventDocSnap.data().isCompleted;

        if (
          req.body.isCompleted !== undefined &&
          req.body.isCompleted !== isEventCompleted
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
          ...req.body,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update sublist updatedAt timestamp
        transaction.update(docSnap.ref, {
          updatedAt: FieldValue.serverTimestamp(),
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
      const { docSnap } = await getSublistDocOrThrow(userId, sublistId);

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

        transaction.update(docSnap.ref, {
          completionStatus: updatedStatus,
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

export default router;
