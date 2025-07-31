import { Timestamp } from "firebase/firestore";

export type Sublist = {
  title: string;
  description: string;
  accessLevel: string;
  collaborators: string[];
  updatedAt: string;
  updatedAtRaw: { _nanoseconds: number; _seconds: number };
  createdAt: string;
  createdAtRaw: { _nanoseconds: number; _seconds: number };
  completionStatus: number[];
  id: string;
  ownerId: string;
};
