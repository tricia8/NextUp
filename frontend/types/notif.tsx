import { Timestamp } from "firebase/firestore";

export type Notif = {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  sentAt: Timestamp;
  status?: string;
  type: string;
  sublistTitle?: string;
};