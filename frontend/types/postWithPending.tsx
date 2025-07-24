import { Post } from "./post";

export type PostWithPending = Post & { isPending: boolean }; // temporary flag to indicate pending posts
