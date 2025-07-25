// Goal type used in [sublistId] screen
export type Goal = {
  id: string; // goalId
  title: string;
  description: string;
  categories: string[];
  isCompleted: boolean;
  updatedAt: string;
  deadline: string;
};
