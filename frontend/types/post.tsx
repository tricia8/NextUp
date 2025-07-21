import { PostImage } from "./postImage";

// Post type used in [goalId] screen
export type Post = {
  id: string; // postId
  userId: string; // userId of the post author
  username: string;
  profilePhotoUrl: string;
  createdAt: string;
  updatedAt: string;
  comment: string;
  images: PostImage[]; // array of image URLs
};
