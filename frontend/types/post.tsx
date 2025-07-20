// Post type used in [goalId] screen
export type Post = {
  id: string; // postId
  userId: string; // userId of the post author
  username: string;
  profilePhotoUrl: string;
  createdAt: string;
  updatedAt: string;
  comment: string;
  imageUrls: string[]; // array of image URLs
};
