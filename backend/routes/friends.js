import { Router } from "express";
import db from "../app.js";

const router = Router();

// Create request
router.post("/friends/request", async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ error: "senderId and receiverId are required" });
  }

  try {
    const friendSnapshot = await getDoc(doc(db, "users", receiverId));
    const currentUserSnapshot = await getDoc(doc(db, "users", senderId));

    if (!friendSnapshot.exists() || !currentUserSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendData = friendSnapshot.data();
    const currentUserData = currentUserSnapshot.data();

    const requestRef = await addDoc(collection(db, "friendRequests"), {
      senderId,
      receiverId,
      senderName: currentUserData?.username,
      receiverName: friendData?.username,
      sentAt: serverTimestamp(),
      status: "pending",
    });

    return res.status(201).json({ requestId: requestRef.id });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Get request info
router.get("/friends/request/:requestId", async (req, res) => {
    const { requestId } = req.params;

    try {
    const requestSnapshot = await getDoc(doc(db, "friendRequests", requestId));

    if (!requestSnapshot.exists()) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const data = requestSnapshot.data();

    return res.status(200).json({
      id: requestSnapshot.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      senderName: data.senderName,
      receiverName: data.receiverName,
      sentAt: data.sentAt,
      status: data.status,
    });
  } catch (error) {
    console.error("Error getting request info:", error);
    return res.status(500).json({ error: "Failed to fetch request info" });
  }
})

// Get friend requests
router.get("/friends/requests/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const q = query(
      collection(db, "friendRequests"),
      where("receiverId", "==", userId),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(200).json({ requests: [] });
    }

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        sentAt: data.sentAt,
        status: data.status,
      };
    });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Get sent requests
router.get("/friends/sent/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const q = query(
      collection(db, "friendRequests"),
      where("senderId", "==", userId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(200).json({ requests: [] });
    }

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        sentAt: data.sentAt,
        status: data.status,
      };
    });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

// Get existing requests
router.get("/friends/hasRequest", async (req, res) => {
  const { userAId, userBId } = req.query;

  if (!userAId || !userBId) {
    return res.status(400).json({ error: "Missing userAId or userBId" });
  }

  try {
    const requestRef = collection(db, "friendRequests");

    const incomingQ = query(
      requestRef,
      where("senderId", "==", userBId),
      where("receiverId", "==", userAId),
      where("status", "==", "pending")
    );
    const incomingSnap = await getDocs(incomingQ);
    if (!incomingSnap.empty) return res.json({ exists: true });

    const outgoingQ = query(
      requestRef,
      where("senderId", "==", userAId),
      where("receiverId", "==", userBId),
      where("status", "==", "pending")
    );
    const outgoingSnap = await getDocs(outgoingQ);
    if (!outgoingSnap.empty) return res.json({ exists: true });

    return res.json({ exists: false });
  } catch (error) {
    console.error("Error checking existing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add friend
router.post("/friends/add", async (req, res) => {
  const { userId, friendId, requestId } = req.body;

  if (!userId || !friendId || !requestId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await runTransaction(db, async (transaction) => {
      const friendDocRef = doc(db, "users", friendId);
      const friendSnap = await transaction.get(friendDocRef);
      if (!friendSnap.exists()) {
        throw new Error("Friend user does not exist");
      }
      const friendData = friendSnap.data();

      const userDocRef = doc(db, "users", userId);
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists()) {
        throw new Error("Current user does not exist");
      }
      const userData = userSnap.data();

      // Add each other as friends
      transaction.set(doc(db, "users", userId, "friends", friendId), {
        username: friendData?.username,
        photoUrl: friendData?.photoUrl || null,
      });

      transaction.set(doc(db, "users", friendId, "friends", userId), {
        username: userData?.username,
        photoUrl: userData?.photoUrl || null,
      });

      // Delete friend request
      transaction.delete(doc(db, "friendRequests", requestId));
    });

    return res.status(200).json({ success: true, message: "Friend added" });
  } catch (error) {
    console.error("Error adding friend:", error);
    return res.status(500).json({ error: "Failed to add friend" });
  }
});

// Reject friend
router.delete("/friendRequests/:requestId/reject", async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

  try {
    const reqDocRef = doc(db, "friendRequests", requestId);
    await deleteDoc(reqDocRef);
    return res.status(200).json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return res.status(500).json({ error: "Failed to reject friend request" });
  }
});

// Remove friend
router.delete("/users/:userId/friends/:friendId", async (req, res) => {
  const { userId, friendId } = req.params;

  try {
    await runTransaction(db, async (transaction) => {
      const currentUserFriendRef = doc(db, "users", userId, "friends", friendId);
      const otherUserFriendRef = doc(db, "users", friendId, "friends", userId);

      transaction.delete(currentUserFriendRef);
      transaction.delete(otherUserFriendRef);
    });

    return res.status(200).json({ success: true, message: "Friend deleted" });
  } catch (error) {
    console.error("Error deleting friend:", error);
    return res.status(500).json({ error: "Failed to delete friend" });
  }
});

// Get friends
router.get("/users/:userId/friends", async (req, res) => {
  const { userId } = req.params;

  try {
    const friendsRef = collection(db, "users", userId, "friends");
    const snapshot = await getDocs(friendsRef);

    const friends = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        username: data.username ?? "",
        photoUrl: data.photoUrl ?? null,
      };
    });

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return res.status(500).json({ error: "Failed to fetch friends" });
  }
});

export default router;
