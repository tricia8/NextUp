import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { debounce } from "lodash";

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
      displayName: user.displayName || null,
    });

    transaction.set(usernameRef, { uid: user.uid });
  });
};

export const setBucketList = async (userId, bucketListData) => {
  try {
    await setDoc(doc(db, "users", userId, "bucketList"), bucketListData);
  } catch (error) {
    console.error("Error creating bucket list:", error);
    throw error;
  }
};

export const createSubBucketList = async (userId, subBucketListData) => {
  try {
    const subBucketListRef = await addDoc(
      collection(db, "users", userId, "bucketList", "subBucketLists"),
      subBucketListData
    );
    return subBucketListRef.id;
  } catch (error) {
    console.error("Error creating subbucket list:", error);
    throw error;
  }
};

export const addEventToSubBucketList = async (
  userId,
  subBucketListId,
  eventData
) => {
  try {
    const eventRef = await addDoc(
      collection(
        db,
        "users",
        userId,
        "bucketList",
        "subBucketLists",
        subBucketListId,
        "events"
      ),
      eventData
    );
    return eventRef.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const updateSubBucketList = async (userId, subBucketListId, updates) => {
  try {
    const bucketListDoc = doc(
      db,
      "users",
      userId,
      "bucketList",
      "subBucketLists",
      subBucketListId
    );
    await updateDoc(bucketListDoc, updates);
  } catch (error) {
    console.error("Error updating bucket list:", error);
    throw error;
  }
};

export const updateEvent = async (
  userId,
  subBucketListId,
  eventId,
  updates
) => {
  try {
    const eventDoc = doc(
      db,
      "users",
      userId,
      "bucketList",
      "subBucketLists",
      subBucketListId,
      "events",
      eventId
    );
    await updateDoc(eventDoc, updates);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteSubBucketList = async (userId, subBucketListId) => {
  try {
    const bucketListDoc = doc(
      db,
      "users",
      userId,
      "bucketList",
      "subBucketLists",
      subBucketListId
    );
    await deleteDoc(bucketListDoc);
  } catch (error) {
    console.error("Error deleting bucket list:", error);
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
      "subBucketLists",
      subBucketListId,
      "events",
      eventId
    );
    await deleteDoc(eventDoc);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const addFriend = async (userId, friendId) => {
  try {
    const currentUserfriendRef = doc(db, "users", userId, "friends", friendId);
    await setDoc(currentUserfriendRef);

    const otherUserfriendRef = doc(db, "users", friendId, "friends", userId);
    await setDoc(otherUserfriendRef);
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
