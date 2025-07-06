import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  query,
  where,
  collectionGroup,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { debounce } from "lodash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const checkUniqueUsername = debounce(async (username, setAvailable) => {
  const normalizedUsername = username.trim().toLowerCase();
  console.log("Normalized username:", normalizedUsername);

  if (normalizedUsername.length >= 1 && normalizedUsername.length <= 15) {
    const usernameRef = doc(db, "usernames", normalizedUsername);
    const usernameSnap = await getDoc(usernameRef);
    console.log("Username exists in DB:", usernameSnap.exists());
    setAvailable(!usernameSnap.exists());
  } else {
    console.log("Invalid username length");
    setAvailable(null); // invalid length
  }
}, 500);

export const createUser = async (user, username) => {
  const userRef = doc(db, "users", user.uid);
  const usernameRef = doc(db, "usernames", username);
  const bucketListStatsRef = doc(db, "users", user.uid, "bucketList", "stats");

  await runTransaction(db, async (transaction) => {
    const usernameDoc = await transaction.get(usernameRef);
    if (usernameDoc.exists()) {
      throw new Error("Username already taken at final step.");
    }

    transaction.set(userRef, {
      uid: user.uid,
      username: username,
      email: user.email,
      photoUrl: user.photoURL ?? null,
      displayName: user.displayName ?? username,
      bio: "",
      category: user.category ?? null,
    });

    transaction.set(usernameRef, { uid: user.uid });

    transaction.set(bucketListStatsRef, {
      totalEvents: 0,
      completedEvents: 0,
    });
  });
};

//profile
export const updateProfile = async (userId, newData) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User does not exist");
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
    } else {
      console.log("No fields were changed. Skipping update.");
    }
  } catch (error) {
    console.error("Error updating profile.");
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();

      return {
        uid: data.id,
        username: data.username,
        email: data.email,
        photoUrl: data.photoUrl,
        displayName: data.displayName,
        bio: data.bio,
        category: data.category,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const getOwnerProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User does not exist");
    }

    console.log("userSnap.data():", userSnap.data());

    return userSnap.data();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

//bucketlist
/*const updateStats = async (userId, type, number) => {
  const statsRef = doc(db, "users", userId, "bucketList", "stats");
  const statsSnap = await getDoc(statsRef);

  if (!statsSnap.exists()) {
    console.warn("Stats document does not exist.");
    return;
  }

  const stats = statsSnap.data();
  let update = null;

  switch (type) {
    case "incrementTotal":
      update = { totalEvents: increment(number) };
      break;
    case "decrementTotal":
      if ((stats.totalEvents ?? 0) - number < 0) {
        // prevent negative values
        console.warn("Prevented decrement: totalEvents would go negative.");
        return;
      }
      update = { totalEvents: decrement(number) };
      break;
    case "incrementCompleted":
      update = { completedEvents: increment(number) };
      break;
    case "decrementCompleted":
      if ((stats.completedEvents ?? 0) - number < 0) {
        // prevent negative values
        console.warn("Prevented decrement: completedEvents would go negative.");
        return;
      }
      update = { completedEvents: decrement(number) };
      break;
    default:
      console.warn(`Invalid update type: ${type}`);
      return;
  }

  if (update) {
    try {
      await updateDoc(statsRef, update);
    } catch (error) {
      console.log("Error updating stats:", error);
      throw error;
    }
  }
};*/

export const getUserStats = async (uid) => {
  try {
    const statsRef = doc(db, "users", uid, "bucketList", "stats");
    const docSnapshot = getDoc(statsRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        totalEvents: data.totalEvents,
        completedEvents: data.completedEvents,
      };
    } else {
      console.log("Stats document does not exist for user:", uid);
      return { totalEvents: 0, completedEvents: 0 };
    }
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

async function updateOverallStats(uid) {
  try {
    const q = query(
      collectionGroup(db, "bucketList"),
      where("collaborators", "array-contains", uid)
    );

    const snapshot = await getDocs(q);

    let totalEvents = 0;
    let completedEvents = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalEvents += data.completionStatus[1] || 0;
      completedEvents += data.completionStatus[0] || 0;
    });

    const statsRef = doc(db, "users", uid, "bucketList", "stats");

    await setDoc(statsRef, {
      totalEvents,
      completedEvents,
    });
  } catch (err) {
    console.error("Error updating stats:", err);
  }
}

//subbucketlists
export const createSubBucketList = async (
  userId,
  { title, description, accessLevel, collaborators }
) => {
  try {
    const subBucketListRef = await addDoc(
      collection(db, "users", userId, "bucketList"),
      {
        title,
        description,
        accessLevel,
        collaborators, // array of userIds
        createdAt: serverTimestamp(), // ensures time format consistency, works better with .toDate()
        completionStatus: [0, 0],
      }
    ); // go to bucketList collection
    return subBucketListRef.id;
  } catch (error) {
    console.error("Error creating sub-bucket list:", error);
    throw error;
  }
};

// don’t have to pass all fields every time, doesn't overwrite unchanged values
// fields: title, description, accessLevel, collaborators, completionStatus
export const updateSubBucketList = async (
  userId,
  subBucketListId,
  updates = {}
) => {
  try {
    const sublistDocRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId
    );
    const docSnap = await getDoc(sublistDocRef);

    if (!docSnap.exists()) {
      throw new Error("List not found");
    }

    await updateDoc(sublistDocRef, updates); // Pass only fields to update
  } catch (error) {
    console.error("Error updating sub-bucket list:", error);
    throw error;
  }
};

// returns formatted data for [sublistId] screen
export const getSubBucketList = async (userId, subBucketListId) => {
  try {
    const sublistDoc = doc(db, "users", userId, "bucketList", subBucketListId);

    const docSnap = await getDoc(sublistDoc);

    if (!docSnap.exists()) {
      throw new Error("List not found");
    }

    const data = docSnap.data(); // object

    const title = data.title;
    const description = data.description ?? ""; // default to empty string;
    const accessLevel = data.accessLevel;
    const collaborators = data.collaborators; // should be an array
    const createdAt = data.createdAt.toDate(); // convert Firestore Timestamp to JS Date
    const createdAtFormatted = formatDisplayDate(createdAt);
    const completionStatus = data.completionStatus;

    return {
      title,
      description,
      accessLevel,
      collaborators,
      createdAtFormatted,
      completionStatus,
    };
  } catch (error) {
    console.error("Error fetching sub-bucket list:", error);
    throw error;
  }
};

export const getFilteredSubBucketLists = async (uid, accessLevels) => {
  try {
    const q = query(
    collectionGroup(db, 'bucketList'),
    where("collaborators", "array-contains", uid),
    where("accessLevel", "in", accessLevels),
  );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
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
  } catch (error) {
    console.error("Error fetching filtered subbucketlists:", error);
    throw error;
  }
};

const formatSublistData = (data) => {
  // data type: Sublist object
  const createdAt = data.createdAt?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    accessLevel: data.accessLevel,
    collaborators: data.collaborators,
    createdAt: createdAt ? formatDisplayDate(createdAt) : null,
    completionStatus: data.completionStatus,
  };
};

// for bucketlist screen
export async function getAllSubBucketLists(uid) {
  const allSublists = [];
  const bucketListRef = collection(db, "users", uid, "bucketList");
  const listSnap = await getDocs(bucketListRef);
  const sublists = listSnap.docs.map((doc) => ({
    id: doc.id,
    ...formatSublistData(doc.data()),
  }));
  allSublists.push(...sublists);
  return allSublists;
}

export const deleteSubBucketList = async (userId, subBucketList) => {
  try {
    const eventsRef = collection(
      db,
      "users",
      userId,
      "bucketList",
      subBucketList.id,
      "events"
    );
    const eventsSnap = await getDocs(eventsRef);

    // Delete all documents in the events collection
    const deletePromises = eventsSnap.docs.map((docSnap) => {
      deleteDoc(docSnap.ref);
    });
    // wait for all deletions to complete since deleteDoc is async
    await Promise.all(deletePromises);

    // delete subBucketList
    const subBucketListRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketList.id
    );

    await deleteDoc(subBucketListRef);

    await updateOverallStats(userId);
  } catch (error) {
    console.error("Error deleting sub-bucket list:", error);
    throw error;
  }
};

//events
export const addEvent = async (
  userId,
  subBucketListId,
  { title, description, categories, deadline, collaborators }
) => {
  try {
    const subBucketListRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId
    );

    // generate a new document with random ID
    const newEventRef = doc(
      collection(db, "users", userId, "bucketList", subBucketListId, "events")
    );

    const eventData = {
      ownerId: userId,
      title,
      description,
      categories,
      collaborators,
      isCompleted: false,
      createdAt: serverTimestamp(),
    };

    // deadline is optional
    if (deadline) {
      eventData.deadline = Timestamp.fromDate(deadline); // `deadline` is a JS Date
    }

    // run transaction to ensure atomicity, ensures data consistency even with concurrent edits
    // good practice for user collaboration
    await runTransaction(db, async (transaction) => {
      // update subBucketList completionStatus
      const subBucketListSnap = await transaction.get(subBucketListRef);

      if (!subBucketListSnap.exists()) {
        throw new Error("Sub-bucket list not found.");
      }

      // add new event
      transaction.set(newEventRef, eventData);

      const completionStatus = subBucketListSnap.data().completionStatus || [
        0, 0,
      ]; // default fallback set

      transaction.update(subBucketListRef, {
        completionStatus: [completionStatus[0], completionStatus[1] + 1],
      });
    });
    // update overall stats
    await updateOverallStats(userId);

    return newEventRef.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const deleteEvent = async (userId, subBucketListId, eventId) => {
  try {
    const eventDocRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId,
      "events",
      eventId
    );

    const subBucketListRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId
    );

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventDocRef);

      if (!eventSnap.exists()) {
        throw new Error("Event not found.");
      }

      const isCompleted = eventSnap.data().isCompleted;

      const subBucketListSnap = await transaction.get(subBucketListRef);

      if (!subBucketListSnap.exists()) {
        throw new Error("Sub-bucket list not found.");
      }

      const completionStatus = subBucketListSnap.data().completionStatus || [
        0, 0,
      ]; // default fallback set

      const [completed, total] = completionStatus;

      // avoid negative values
      const updatedStatus = isCompleted
        ? [Math.max(0, completed - 1), Math.max(0, total - 1)]
        : [completed, Math.max(0, total - 1)];

      transaction.delete(eventDocRef);
      transaction.update(subBucketListRef, {
        completionStatus: updatedStatus,
      });
      console.log(
        `Deleted event ${eventId} and updated sublist ${subBucketListId}`
      );
    });
    await updateOverallStats(userId);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// convert Timestamp to string e.g. "3 days ago (14 Jun)"
const formatDisplayDate = (fetchedDate) => {
  return `${dayjs(fetchedDate).fromNow()} (${dayjs(fetchedDate).format(
    "DD MMM YYYY"
  )})`;
};

const formatEventData = (data) => {
  // data type: Event object
  const createdAt = data.createdAt?.toDate?.();
  const deadline = data.deadline?.toDate?.();

  return {
    title: data.title,
    description: data.description ?? "", // default to empty string
    categories: data.categories ?? [], // default to empty array
    deadline: deadline ? formatDisplayDate(deadline) : "",
    isCompleted: data.isCompleted,
    createdAt: createdAt ? formatDisplayDate(createdAt) : "",
  };
};

// for [goalId] screen
export const getEvent = async (userId, subBucketListId, eventId) => {
  try {
    const eventDoc = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId,
      "events",
      eventId
    );

    const docSnap = await getDoc(eventDoc);
    if (!docSnap.exists()) {
      throw new Error("Event not found");
    }

    const data = docSnap.data(); // object

    const title = data.title;
    const description = data.description ?? ""; // default to empty string
    const categories = data.categories ?? []; // default to empty array
    const deadlineFormatted = data.deadline.toDate()
      ? formatDisplayDate(data.deadline.toDate())
      : null;
    const isCompleted = data.isCompleted;
    const collaborators = data.collaborators;
    const createdAt = data.createdAt.toDate(); // convert Firestore Timestamp to JS Date
    const createdAtFormatted = formatDisplayDate(createdAt);

    return {
      title,
      description,
      categories,
      deadline: deadlineFormatted, // could be null
      isCompleted,
      collaborators,
      createdAt: createdAtFormatted,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

// for [sublistId] screen
export async function getAllEventsFormatted(uid, subBucketListId) {
  const allEvents = [];

  const eventsRef = collection(
    db,
    "users",
    uid,
    "bucketList",
    subBucketListId,
    "events"
  );
  const eventsSnap = await getDocs(eventsRef);

  const formattedEvents = eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...formatEventData(doc.data()),
  }));

  allEvents.push(...formattedEvents);
  return allEvents;
}

// unformatted
export async function getAllEvents(uid, subBucketLists) {
  const allEvents = [];
  for (const sub of subBucketLists) {
    const eventsRef = collection(
      db,
      "users",
      uid,
      "bucketList",
      sub.id,
      "events"
    );

    const eventsSnap = await getDocs(eventsRef);

    const events = eventsSnap.docs.map((doc) => {
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
  return allEvents;
}

// title, description, categories, deadline, isCompleted, collaborators
// used for updates excluding completion status
export const updateEvent = async (
  userId,
  subBucketListId,
  eventId,
  updates = {}
) => {
  try {
    const eventDocRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId,
      "events",
      eventId
    );
    const docSnap = await getDoc(eventDocRef);
    if (!docSnap.exists()) {
      throw new Error("Event not found");
    }

    await updateDoc(eventDocRef, updates);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const toggleEventCompletion = async (
  userId,
  subBucketListId,
  eventId
) => {
  try {
    const eventDocRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId,
      "events",
      eventId
    );

    const subBucketListRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId
    );

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventDocRef);

      if (!eventSnap.exists()) {
        throw new Error("Event not found");
      }

      const subBucketListSnap = await transaction.get(subBucketListRef);
      if (!subBucketListSnap.exists()) {
        throw new Error("Sub-bucket list not found.");
      }
      const currentCompleted = eventSnap.data().isCompleted;
      const [completed, total] = subBucketListSnap.data().completionStatus || [
        0, 0,
      ];
      const updatedStatus = !currentCompleted
        ? [completed + 1, total]
        : [Math.max(0, completed - 1), total]; // avoid negative values

      /* await updateDoc(eventDocRef, {
      isCompleted: !currentCompleted,
    }); */

      // update event
      transaction.update(eventDocRef, { isCompleted: !currentCompleted });

      // update subBucketList completionStatus
      transaction.update(subBucketListRef, {
        completionStatus: updatedStatus,
      });
    });

    await updateOverallStats(userId);
  } catch (error) {
    console.error("Error toggling event completion");
    throw error;
  }
};

export async function getUpcomingEvents(uid, now, onData) {
  try {
    const q = query(
      collectionGroup(db, "events"),
      where("collaborators", "array-contains", uid),
      where("deadline", ">=", Timestamp.fromDate(now)),
      where("isCompleted", "==", false),
      orderBy("deadline"),
      limit(3)
    );

    const snapshot = await getDocs(q);

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    onData(events);
  } catch (err) {
    console.error("Error fetching upcoming:", err);
    throw err;
  }
}

export async function getOverdueEvents(uid, now, onData) {
  try {
    const q = query(
      collectionGroup(db, "events"),
      where("collaborators", "array-contains", uid),
      where("deadline", "<", Timestamp.fromDate(now)),
      where("isCompleted", "==", false)
    );

    const snapshot = await getDocs(q);

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    onData(events);
  } catch (err) {
    console.error("Error fetching overdue:", err);
    throw err;
  }
}

//friends
export const createRequest = async (userId, friendId) => {
  try {
    const friendSnapshot = await getDoc(doc(db, "users", friendId));
    const friendData = friendSnapshot.data();
    const currentUserSnapshot = await getDoc(doc(db, "users", userId));
    const currentUserData = currentUserSnapshot.data();

    const requestRef = await addDoc(
      collection(db, "friendRequests"),
      {
        senderId: userId,
        receiverId: friendId,
        senderName: currentUserData?.username,
        receiverName: friendData?.username,
        sentAt: serverTimestamp(),
        status: "pending",
      }
    );

    return requestRef.id;
  } catch (error) {
    console.log("Error sending friend request:", error);
    throw error;
  }
}

export const getRequestInfo = async (requestId) => {
  try {
    const requestSnapshot = await getDoc(doc(db, "friendRequests", requestId));

    if (!requestSnapshot.exists()) {
      throw new Error("Friend request not found");
    }
    
    const requestData = requestSnapshot.data();

    return {
      id: requestSnapshot.id,
      senderId: requestData.senderId,
      receiverId: requestData.receiverId,
      senderName: requestData.senderName,
      receiverName: requestData.receiverName,
      sentAt: requestData.sentAt,
      status: requestData.status,
    }
  } catch (error) {
    console.log("Error getting request info:", error);
    throw error;
  }
}

export const getFriendRequests = async (userId) => {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("receiverId", "==", userId),
      where("status", "==", "pending"),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return []; 
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        sentAt: data.sentAt,
        status: data.status,
      }
    });
  } catch (error) {
    console.log("Error fetching friend requests:", error);
    throw error;
  }
}

export const getSentRequests = async (userId) => {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("senderId", "==", userId),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return []; 
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        sentAt: data.sentAt,
        status: data.status,
      }
    });
  } catch (error) {
    console.log("Error fetching sent requests:", error);
    throw error;
  }
}

export const hasExistingRequest = async (userAId, userBId) => {
  try {
    const requestRef = collection(db, "friendRequests");

    const incomingQ = query(     // Check for request from userB to userA
      requestRef,
      where("senderId", "==", userBId),
      where("receiverId", "==", userAId),
      where("status", "==", "pending")
    );

    const incomingSnap = await getDocs(incomingQ);
    if (!incomingSnap.empty) return true;

    const outgoingQ = query(     // Check for request from userA to userB
      requestRef,
      where("senderId", "==", userAId),
      where("receiverId", "==", userBId),
      where("status", "==", "pending")
    );

    const outgoingSnap = await getDocs(outgoingQ);
    if (!outgoingSnap.empty) return true;

    return false;
  } catch (error) {
    console.log("Error checking for existing request", error);
  }
}

export const addFriend = async (userId, friendId, requestId) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Read both user docs inside transaction
      const friendDocRef = doc(db, "users", friendId);
      const friendSnapshot = await transaction.get(friendDocRef);
      if (!friendSnapshot.exists()) {
        throw new Error("Friend user does not exist");
      }
      const friendData = friendSnapshot.data();

      const currentUserDocRef = doc(db, "users", userId);
      const currentUserSnapshot = await transaction.get(currentUserDocRef);
      if (!currentUserSnapshot.exists()) {
        throw new Error("Current user does not exist");
      }
      const currentUserData = currentUserSnapshot.data();

      const currentUserFriendRef = doc(db, "users", userId, "friends", friendId);
      transaction.set(currentUserFriendRef, {
        username: friendData?.username,
        photoUrl: friendData?.photoUrl || null,
      });

      const otherUserFriendRef = doc(db, "users", friendId, "friends", userId);
      transaction.set(otherUserFriendRef, {
        username: currentUserData?.username,
        photoUrl: currentUserData?.photoUrl || null,
      });

      // Delete friend request
      const requestDocRef = doc(db, "friendRequests", requestId);
      transaction.delete(requestDocRef);
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const rejectFriend = async (requestId) => {
  try {
    const reqDoc = doc(db, "friendRequests", requestId);
    //const reqSnapshot = await getDoc(reqDoc);

    /*if (!reqSnapshot.exists()) {
      throw new Error("Request not found");
    }*/

    //await updateDoc(reqDoc, { status: "rejected" });
    await deleteDoc(reqDoc);
  } catch (error) {
    console.error("Error rejecting friend", error);
    throw error;
  }
}

export const deleteFriend = async (userId, friendId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const currentUserFriendRef = doc(db, "users", userId, "friends", friendId);
      const otherUserFriendRef = doc(db, "users", friendId, "friends", userId);

      transaction.delete(currentUserFriendRef);
      transaction.delete(otherUserFriendRef);
    });
  } catch (error) {
    console.error("Error deleting friend:", error);
    throw error;
  }
};

export async function getFriends(currentUserId) {
  try {
    const ref = collection(db, "users", currentUserId, "friends");
    const snapshot = await getDocs(ref);
    const data = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return {
        uid: doc.id,
        username: docData.username ?? "",
        photoUrl: docData.photoUrl ?? null,
      };
    });
    return data;
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
}

//miscellaneous
export const getRelationship = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    return "self";
  }

  try {
    const docRef = doc(db, "users", currentUserId, "friends", targetUserId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return "friend";
    } else {
      return "none";
    }
  } catch (error) {
    console.error("Error fetching relationship:", error);
    throw error;
  }
};

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const data = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return {
        uid: doc.id,
        username: docData.username,
        photoUrl: docData.photoUrl,
        email: docData.email,
        displayName: docData.displayName,
        bio: docData.bio,
        category: docData.category,
      };
    });
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
