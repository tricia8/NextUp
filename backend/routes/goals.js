import { Router } from "express";
import db from "../app.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

const router = Router();

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

// Add a goal (owners and collaborators only)
router.post("/users/:userId/bucketList/:sublistId/events", async (req, res) => {
  const { userId, sublistId } = req.params;
  const { title, description, categories, deadline, collaborators } = req.body;

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
router.get(
  "/users/:userId/bucketList/:sublistId/events/:eventId",
  async (req, res) => {
    const { userId, sublistId, eventId } = req.params;
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
        eventData: formattedEventData,
        formattedPosts,
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
);

// Update goal metadata (owners and collaborators only), excluding post content
router.patch(
  "/users/:userId/bucketList/:sublistId/events/:eventId",
  async (req, res) => {
    const { userId, sublistId, eventId } = req.params;
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
            updatedAt: FieldValue.serverTimestamp(),
            completionStatus: updatedStatus,
          });
        }

        // Update event document
        transaction.update(eventDocRef, {
          ...req.body,
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
  "/users/:userId/bucketList/:sublistId/events/:eventId",
  async (req, res) => {
    const { userId, sublistId, eventId } = req.params;
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
