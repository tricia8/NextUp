// Goal type used in [sublistId] screen
export type Goal = {
  id: string; // goalId
  title: string;
  description: string;
  categories: string[];
  isCompleted: boolean;
  createdAt: string;
  deadline: string;
};
