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
export const createSubBucketList = async ({
  title,
  description,
  accessLevel,
  collaborators,
}) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          accessLevel,
          collaborators, // array of userIds
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to create sub-bucket list"
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creating sub-bucket list:", error);
    throw error;
  }
};

// don’t have to pass all fields every time, doesn't overwrite unchanged values
// fields: title, description, accessLevel, collaborators, completionStatus
export const updateSubBucketList = async (subBucketListId, updates = {}) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to update sub-bucket list"
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating sub-bucket list:", error);
    throw error;
  }
};

// returns formatted data for [sublistId] screen
export const getSubBucketList = async (subBucketListId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await get(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to fetch sub-bucket list"
      );
    }

    const data = await res.json();
    return data;
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

// fetch all owned and unowned sub-bucket lists
export async function getAllSubBucketLists() {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await get(
      `https://nextup-l0e9.onrender.com/api/user/bucketList`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to fetch all sub-bucket lists"
      );
    }

    const data = await res.json();
    return data; // array of sub-bucket lists
  } catch (error) {
    console.error("Error fetching all sub-bucket lists:", error);
    throw error;
  }
}

// fetch only unowned sub-bucket lists
export async function getUnownedSubBucketLists() {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await get(
      `https://nextup-l0e9.onrender.com/api/user/sharedSublists`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to fetch unowned sub-bucket lists"
      );
    }

    const data = await res.json();
    return data; // array of sub-bucket lists
  } catch (error) {
    console.error("Error fetching all unowned sub-bucket lists:", error);
    throw error;
  }
}

// fetch only owned sub-bucket lists
export async function getOwnedSubBucketLists() {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await get(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/owned`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to fetch owned sub-bucket lists"
      );
    }

    const data = await res.json();
    return data; // array of sub-bucket lists
  } catch (error) {
    console.error("Error fetching all owned sub-bucket lists:", error);
    throw error;
  }
}

export const deleteSubBucketList = async (subBucketList) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketList.id}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        `${res.status.toString()}: ${data.error}` ||
          "Failed to delete sub-bucket list"
      );
    }

    const data = await res.json();
    return data; // success message
  } catch (error) {
    console.error("Error deleting sub-bucket list:", error);
    throw error;
  }
};

export const getSublistInvites = async () => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/sublists/invites`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData?.error || "Failed to fetch list invites");
    }

    const data = await res.json();
    return data.invites;
  } catch (error) {
    console.error("Error fetching list invites:", error);
    throw error;
  }
};

export const deleteInvite = async (requestId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/listInvites/${requestId}/delete`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete list invite");
    }

    return true;
  } catch (error) {
    console.error("Error deleting invite", error);
    throw error;
  }
};

//events
export const addEvent = async (
  subBucketListId,
  { title, description, categories, deadline, collaborators }
) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/events`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          categories,
          deadline,
          collaborators, // array of userIds
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` || "Failed to add event"
      );
    }

    const data = await res.json();
    return data; // success boolean and new event ID
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const deleteEvent = async (subBucketListId, eventId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to delete event or update completion stats"
      );
    }

    const data = await res.json();
    return data; // success boolean and message
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
export const getEvent = async (subBucketListId, eventId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/events/${eventId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to fetch event"
      );
    }

    const data = await res.json();
    return data; // goalData, posts
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

// for [sublistId] screen (might not need, since logic is encapsulated in getSubBucketList))
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
export const updateEvent = async (subBucketListId, eventId, updates = {}) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to update event"
      );
    }

    const data = await res.json();
    return { eventData: data.formattedEventData };
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

// collaborators
export const addCollaborator = async (subBucketListId, collaboratorId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/collaborators/${collaboratorId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to add collaborator"
      );
    }

    const data = await res.json();
    return data; // returns success boolean, message and invitationId
  } catch (error) {
    console.log("Error inviting collaborator:", error);
    throw error;
  }
};

// remove collaborator as an owner
export const removeCollaboratorByOwner = async (
  subBucketListId,
  collaboratorId
) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/collaborators/${collaboratorId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to remove collaborator"
      );
    }

    const data = await res.json();
    return data; // returns success boolean and message
  } catch (error) {
    console.log("Error removing collaborator:", error);
    throw error;
  }
};

// self-remove collaborator status (not owner)
export const removeCollaboratorBySelf = async (subBucketListId) => {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      `https://nextup-l0e9.onrender.com/api/user/bucketList/${subBucketListId}/collaborators/${collaboratorId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `${res.status.toString()}: ${errorData.error}` ||
          "Failed to remove self as collaborator"
      );
    }

    const data = await res.json();
    return data; // returns success boolean, message and invitationId
  } catch (error) {
    console.log("Error removing collaborator:", error);
    throw error;
  }
};

// friends
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
