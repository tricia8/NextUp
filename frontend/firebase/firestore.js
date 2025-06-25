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
      displayName: "",
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
    const docSnapshot = await getDoc(statsRef);

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
const updateSubBucketList = async (userId, subBucketListId, updates = {}) => {
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
    const ref = collection(db, "users", uid, "bucketList");
    const q = query(ref, where("accessLevel", "in", accessLevels));
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

    updateOverallStats(userId);
  } catch (error) {
    console.error("Error deleting sub-bucket list:", error);
    throw error;
  }
};

//events
export const addEvent = async (
  userId,
  subBucketListId,
  { title, description, categories, deadline }
) => {
  try {
    const eventData = {
      ownerId: userId,
      title,
      description,
      categories,
      isCompleted: false,
      createdAt: serverTimestamp(),
    };

    // deadline is optional
    if (deadline) {
      eventData.deadline = Timestamp.fromDate(deadline); // `deadline` is a JS Date
    }

    const eventDoc = await addDoc(
      collection(db, "users", userId, "bucketList", subBucketListId, "events"),
      eventData
    );

    updateOverallStats(userId);

    return eventDoc.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const deleteEvent = async (userId, subBucketListId, eventId) => {
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

    await deleteDoc(eventDoc);

    updateOverallStats(userId);
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
    const createdAt = data.createdAt.toDate(); // convert Firestore Timestamp to JS Date
    const createdAtFormatted = formatDisplayDate(createdAt);

    return {
      title,
      description,
      categories,
      deadline: deadlineFormatted, // could be null
      isCompleted,
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
export async function getAllEvents(db, uid, subBucketLists) {
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

// title, description, categories, deadline, isCompleted
export const updateEvent = async (
  userId,
  subBucketListId,
  eventId,
  updates = {}
) => {
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

    await updateDoc(eventDoc, updates);
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

    const currentCompleted = docSnap.data().isCompleted;

    await updateDoc(eventDoc, {
      isCompleted: !currentCompleted,
    });

    updateOverallStats(userId);
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
  }
}

export async function getOverdueEvents(uid, now, onData) {
  try {
    const q = query(
      collectionGroup(db, "bucketList"),
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
  }
}

//friends
export const addFriend = async (userId, friendId) => {
  try {
    const friendSnapshot = await getDoc(doc(db, "users", friendId));
    const friendData = friendSnapshot.data();

    const currentUserfriendRef = doc(db, "users", userId, "friends", friendId);
    await setDoc(currentUserfriendRef, {
      username: friendData?.username,
      photoUrl: friendData?.photoUrl || null,
    });

    const currentUserSnapshot = await getDoc(doc(db, "users", userId));
    const currentUserData = currentUserSnapshot.data();

    const otherUserfriendRef = doc(db, "users", friendId, "friends", userId);
    await setDoc(otherUserfriendRef, {
      username: currentUserData?.username,
      photoUrl: currentUserData?.photoUrl || null,
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const deleteFriend = async (userId, friendId) => {
  try {
    const currentUserfriendRef = doc(db, "users", userId, "friends", friendId);
    await deleteDoc(currentUserfriendRef);

    const otherUserfriendRef = doc(db, "users", friendId, "friends", userId);
    await deleteDoc(otherUserfriendRef);
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
