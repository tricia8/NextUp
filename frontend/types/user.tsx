export type User = {
  uid: string;
  username: string;
  email: string | null;
  photoUrl: string | null;
  displayName: string;
  bio: string;
  category: string[];
};