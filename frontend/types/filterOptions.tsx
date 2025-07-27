export type FilterOptions = {
  owned?: boolean;
  shared?: boolean;
  visibility?: "private" | "friends" | "everyone";
  progressStatus?: "Completed" | "In Progress" | "Getting Started";
};
