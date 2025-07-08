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
} from "firebase/firestore";
import { debounce } from "lodash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getIdTokenFromFirebaseUser } from "../utils/getIdToken";

dayjs.extend(relativeTime);

export const checkUniqueUsername = debounce(async (username, setAvailable) => {
  const normalizedUsername = username.trim().toLowerCase();
  console.log("Normalized username:", normalizedUsername);

  if (normalizedUsername.length >= 1 && normalizedUsername.length <= 15) {
    try {
      const res = await fetch(
        `https://nextup-l0e9.onrender.com/api/checkUsername?username=${normalizedUsername}`
      );

      if (!res.ok) {
        console.error("Server error checking username");
        setAvailable(null);
        return;
      }

      const data = await res.json();
      setAvailable(data.available);
    } catch (error) {
      console.error("Error checking username:", error);
      setAvailable(null);
    }
  } else {
    console.log("Invalid username length");
    setAvailable(null);
  }
}, 500);

export const createUser = async (user, username) => {
  const token = await getIdTokenFromFirebaseUser();

  try {
    const res = await fetch(`https://nextup-l0e9.onrender.com/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid: user.uid, username, email: user.email }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || "Failed to create user");
    }

    return true;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

//profile
export const updateProfile = async (userId, newData) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      "https://nextup-l0e9.onrender.com/api/users/updateProfile",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || "Failed to update profile");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating profile.");
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/users/${uid}/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || "Failed to fetch user profile");
    }

    const data = await res.json();

    return {
      uid: data.uid,
      username: data.username,
      email: data.email,
      photoUrl: data.photoUrl,
      displayName: data.displayName,
      bio: data.bio,
      category: data.category,
    };
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
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/${uid}/bucketList/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch user stats");
    }

    const data = await res.json();
    return {
      totalEvents: data.totalEvents,
      completedEvents: data.completedEvents,
    };
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
    const token = await getIdTokenFromFirebaseUser();

    const queryParams = new URLSearchParams({
      userId: uid,
      accessLevels: accessLevels.join(","),
    });

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/filteredSublists?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch sublists");
    }

    const data = await res.json();
    return data.sublists;
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
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/sublists/allEvents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, subBucketLists }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await res.json();
    return data.events;
  } catch (error) {
    console.error("Error fetching events of given sublists:", error);
    throw error;
  }
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
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/users/${userId}/bucketList/${subBucketListId}/events/${eventId}/toggleCompletion`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to toggle event completion");
    }

    return true;
  } catch (error) {
    console.error("Error toggling event completion");
    throw error;
  }
};

export async function getUpcomingEvents(uid, now) {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/events/upcoming`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid,
          now: new Date(now).toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to fetch upcoming events");
    }

    const data = await res.json();
    return data.events;
  } catch (err) {
    console.error("Error fetching upcoming:", err);
    throw err;
  }
}

export async function getOverdueEvents(uid, now) {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/events/overdue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid,
          now: new Date(now).toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to fetch overdue events");
    }

    const data = await res.json();
    return data.events;
  } catch (err) {
    console.error("Error fetching overdue:", err);
    throw err;
  }
}

//friends
export const createRequest = async (senderId, receiverId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      "https://nextup-l0e9.onrender.com/api/friends/request",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId, receiverId }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to send friend request");
    }

    const data = await res.json();
    return data.requestId;
  } catch (error) {
    console.log("Error sending friend request:", error);
    throw error;
  }
};

export const getRequestInfo = async (requestId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friends/request/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch friend request info");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("Error getting request info:", error);
    throw error;
  }
};

export const getFriendRequests = async (userId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friends/requests/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch friend requests");
    }

    const { requests } = await res.json();
    return requests;
  } catch (error) {
    console.log("Error fetching friend requests:", error);
    throw error;
  }
};

export const getSentRequests = async (userId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friends/sent/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch sent requests");
    }

    const { requests } = await res.json();
    return requests;
  } catch (error) {
    console.log("Error fetching sent requests:", error);
    throw error;
  }
};

export const hasExistingRequest = async (userAId, userBId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const queryParams = new URLSearchParams({ userAId, userBId });

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friends/hasRequest?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.error || "Failed to check for existing request"
      );
    }

    const data = await res.json();
    return data.exists;
  } catch (error) {
    console.log("Error checking for existing request", error);
  }
};

export const addFriend = async (userId, friendId, requestId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friends/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, friendId, requestId }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to add friend");
    }

    return true;
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const rejectFriend = async (requestId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/friendRequests/${requestId}/reject`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to reject friend request");
    }

    return true;
  } catch (error) {
    console.error("Error rejecting friend", error);
    throw error;
  }
};

export const deleteFriend = async (userId, friendId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/users/${userId}/friends/${friendId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to delete friend");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error deleting friend:", error);
    throw error;
  }
};

export async function getFriends(currentUserId) {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/users/${currentUserId}/friends`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch friends");
    }

    const data = await res.json();
    return data.friends;
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
}

//miscellaneous
export const getRelationship = async (currentUserId, targetUserId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/relationship?targetUserId=${targetUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get relationship");
    }

    const data = await res.json();
    return data.relationship;
  } catch (error) {
    console.error("Error fetching relationship:", error);
    throw error;
  }
};

export async function getAllUsers() {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch("https://nextup-l0e9.onrender.com/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch users");
    }

    const users = await res.json();
    return users.map((user) => ({
      uid: user.uid,
      username: user.username,
      photoUrl: user.photoUrl,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      category: user.category,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
