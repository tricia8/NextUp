export type User = {
  uid: string;
  username: string;
  email?: string | null;
  photoUrl: string | null;
  displayName?: string | null;
  bio?: string | null;
  category?: string[] | null,
};