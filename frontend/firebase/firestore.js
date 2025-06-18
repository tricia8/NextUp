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
      displayName: '',
      bio: '',
    });

    transaction.set(usernameRef, { uid: user.uid });
  });
};

export const updateProfile = async (userId, newData) => {
  try {
    const userRef = doc(db, "users", uid);
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
    console.error("Error updating profile.")
    throw error;
  }
}

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
