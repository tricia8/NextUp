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
  onSnapshot,
  collectionGroup,
  getDocs
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
  const bucketListStatsRef = collection(
    db,
    "users",
    user.uid,
    "bucketList",
    "stats"
  );

  await runTransaction(db, async (transaction) => {
    const usernameDoc = await transaction.get(usernameRef);
    if (usernameDoc.exists()) {
      throw new Error("Username already taken at final step.");
    }

    transaction.set(userRef, {
      uid: user.uid,
      username: username,
      email: user.email,
      photoUrl: user.photoURL,
      displayName: "",
      bio: "",
      category: user.category,
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

export const getUserProfile = async (db, uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

//bucketlist
const updateOverallStats = async (userId, type) => {
  const statsRef = doc(db, "users", userId, "bucketList", "stats");

  const fieldMap = {
    incrementTotal: { totalEvents: increment(1) },
    decrementTotal: { totalEvents: decrement(1) },
    incrementCompleted: { totalEvents: increment(1) },
    decrementCompleted: { totalEvents: decrement(1) },
  };

  try {
    await updateDoc(statsRef, fieldMap[type]);
  } catch (error) {
    console.log("Error updating stats");
    throw error;
  }
};

export const getUserStats = async (db, uid) => {
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

export function getFilteredSubBucketLists(db, uid, accessLevels, onData) {
  if (!uid || !accessLevels.length) return () => {};
  const ref = collection(db, "users", uid, "bucketList");
  const q = query(ref, where("accessLevel", "in", accessLevels));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    onData(data);
  });
  return unsubscribe;
}

export const deleteSubBucketList = async (userId, subBucketListId) => {
  try {
    const subBucketListRef = doc(
      db,
      "users",
      userId,
      "bucketList",
      subBucketListId
    );
    await deleteDoc(subBucketListRef);
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

    updateOverallStats(userId, incrementTotal);

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

    updateOverallStats(userId, incrementTotal);
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
    const deadlineFormatted = data.deadline
      ? formatDisplayDate(data.deadline)
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
      createdAtFormatted,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

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
    const events = eventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
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

    if (currentCompleted) {
      updateOverallStats(userId, decrementCompleted);
    } else {
      updateOverallStats(userId, incrementCompleted);
    }

    await updateDoc(eventDoc, {
      isCompleted: !currentCompleted,
    });
  } catch (error) {
    console.error("Error toggling event completion");
    throw error;
  }
};

export function getUpcomingEvents(db, uid, now, onData) {
  const upcomingQ = query(
    collectionGroup(db, 'events'),
    where('ownerId', '==', uid),
    where('deadline', '>=', Timestamp.fromDate(now)),
    where('isCompleted', '==', false),
    orderBy('deadline'),
    limit(3)
  );
  return onSnapshot(upcomingQ, (snapshot) => {
    const upcoming = snapshot.docs.map(doc => ({
      ...(doc.data()),
      id: doc.id,
    }));
    onData(upcoming);
  });
}

export function getOverdueEvents(db, uid, now, onData) {
  const overdueQ = query(
    collectionGroup(db, 'events'),
    where('ownerId', '==', uid),
    where('deadline', '<', Timestamp.fromDate(now)),
    where('isCompleted', '==', false)
  );
  return onSnapshot(overdueQ, (snapshot) => {
    const overdue = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    onData(overdue);
  });
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

export function getFriends(db, currentUserId, onData) {
  const ref = collection(db, "users", currentUserId, "friends");
  return onSnapshot(ref, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));
    onData(data);
  });
}

//miscellaneous
export function getRelationship(db, currentUserId, targetUserId, onChange) {
  if (!currentUserId || !targetUserId) return () => {};

  if (currentUserId === targetUserId) {
    onChange("self");
    return () => {};
  }

  const docRef = doc(db, "users", currentUserId, "friends", targetUserId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onChange("friend");
    } else {
      onChange("none");
    }
  });

  return unsubscribe;
}

export function getAllUsers(db, onData) {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));
    onData(data);
  });
}
