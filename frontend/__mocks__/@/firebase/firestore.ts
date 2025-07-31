import { db } from "@/firebase/firebaseConfig";
import { Sublist } from "@/types/sublist";

export const mockSublists: Sublist[] = [
  {
    id: "1",
    title: "Travel Goals",
    description: "",
    accessLevel: "private",
    collaborators: ["test-uid"],
    updatedAt: "",
    completionStatus: [8, 8],
    ownerId: "test-uid",
  },
  {
    id: "2",
    title: "Shopping List",
    description: "",
    accessLevel: "friends",
    collaborators: ["uid-2", "test-uid"],
    updatedAt: "",
    completionStatus: [2, 5],
    ownerId: "uid-2",
  },
  {
    id: "3",
    title: "Coding Projects",
    description: "",
    accessLevel: "everyone",
    collaborators: ["test-uid"],
    updatedAt: "",
    completionStatus: [0, 5],
    ownerId: "test-uid",
  },
];

// mock Firestore implementation
const mockFirestore = {
  // getFirestore: jest.fn().mockReturnValue(db),
  // onSnapshot: jest.fn(() => () => {}), // returns unsubscribe
  getAllSubBucketLists: jest.fn().mockResolvedValue(mockSublists),
  getUnownedSubBucketLists: jest.fn().mockResolvedValue([mockSublists[1]]),
  getOwnedSubBucketLists: jest
    .fn()
    .mockResolvedValue([mockSublists[0], mockSublists[2]]),
};

export default mockFirestore;
/* export default {
  getFirestore,
  getAllSubBucketLists,
  getOwnedSubBucketLists,
  getUnownedSubBucketLists,
  onSnapshot,
}; */
