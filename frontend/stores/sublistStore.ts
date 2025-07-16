// stores/sublistStore.ts
import { Goal } from "@/types/goal";
import { Post } from "@/types/post";
import { Sublist } from "@/types/sublist";
import { create } from "zustand";

type SublistWithoutId = Omit<Sublist, "id"> & {
  ownerId: string;
};

interface SublistState {
  sublistData: { [sublistId: string]: SublistWithoutId };
  goalsBySublist: Record<string, Record<string, Goal>>;
  goalOrderBySublist: Record<string, string[]>; // store array of goal IDs for each sublist
  postsByGoal: Record<string, Record<string, Post>>;
  postOrderByGoal: Record<string, string[]>; // store array of post IDs for each goal

  // goalData: { [goalId: string]: Goal };
  setSublist: (
    sublistId: string,
    data: Omit<Sublist, "id">,
    ownerId: string
  ) => void;

  updateSublistField: <K extends keyof SublistWithoutId>(
    sublistId: string,
    key: K,
    value: SublistWithoutId[K]
  ) => void;

  setGoalsForSublist: (
    sublistId: string,
    goalsRecord: Record<string, Goal>,
    goalOrder: string[]
  ) => void;

  addGoalToSublist: (sublistId: string, goal: Goal) => void;
  // setGoal: (goalId: string, data: Goal) => void;

  removeGoalFromSublist: (sublistId: string, goalId: string) => void;

  setPostsForGoal: (
    goalId: string,
    postsRecord: Record<string, Post>,
    postOrder: string[]
  ) => void;

  addPostToGoal: (goalId: string, post: Post) => void;

  removePostFromGoal: (goalId: string, postId: string) => void;

  clearStore: () => void;
}

export const useSublistStore = create<SublistState>()((set) => ({
  sublistData: {},
  goalsBySublist: {},
  goalOrderBySublist: {},
  postsByGoal: {},
  postOrderByGoal: {},

  setSublist: (sublistId, data, ownerId) =>
    set((state) => ({
      sublistData: {
        ...state.sublistData,
        [sublistId]: { ...data, ownerId },
      },
    })),

  updateSublistField: (sublistId, key, value) =>
    set((state) => ({
      sublistData: {
        ...state.sublistData,
        [sublistId]: {
          ...state.sublistData[sublistId],
          [key]: value,
        },
      },
    })),

  setGoalsForSublist: (sublistId, goalsRecord, goalOrder) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: goalsRecord,
      },
      goalOrderBySublist: {
        ...state.goalOrderBySublist,
        [sublistId]: goalOrder,
      },
    })),

  addGoalToSublist: (sublistId, goal) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: { ...state.goalsBySublist[sublistId], [goal.id]: goal },
      },
      goalOrderBySublist: {
        ...state.goalOrderBySublist,
        [sublistId]: [goal.id, ...(state.goalOrderBySublist[sublistId] || [])],
      },
    })),

  removeGoalFromSublist: (sublistId, goalId) =>
    set((state) => {
      const updatedSublistGoals = {
        ...(state.goalsBySublist[sublistId] || {}),
      };
      delete updatedSublistGoals[goalId];

      return {
        goalsBySublist: {
          ...state.goalsBySublist,
          [sublistId]: updatedSublistGoals,
        },
        goalOrderBySublist: {
          ...state.goalOrderBySublist,
          [sublistId]: (state.goalOrderBySublist[sublistId] || []).filter(
            (id) => id !== goalId
          ),
        },
      };
    }),

  setPostsForGoal: (goalId, postsRecord, postOrder) =>
    set((state) => ({
      postsByGoal: {
        ...state.postsByGoal,
        [goalId]: postsRecord,
      },
      postOrderByGoal: {
        ...state.postOrderByGoal,
        [goalId]: postOrder,
      },
    })),

  addPostToGoal: (goalId, post) =>
    set((state) => ({
      postsByGoal: {
        ...state.postsByGoal,
        [goalId]: {
          ...(state.postsByGoal[goalId] || {}),
          [post.id]: post,
        },
      },
      postOrderByGoal: {
        ...state.postOrderByGoal,
        [goalId]: [post.id, ...(state.postOrderByGoal[goalId] || [])],
      },
    })),

  removePostFromGoal: (goalId, postId) =>
    set((state) => {
      const updatedPosts = {
        ...(state.postsByGoal[goalId] || {}),
      };
      delete updatedPosts[postId];

      return {
        postsByGoal: {
          ...state.postsByGoal,
          [goalId]: updatedPosts,
        },
        postOrderByGoal: {
          ...state.postOrderByGoal,
          [goalId]: (state.postOrderByGoal[goalId] || []).filter(
            (id) => id !== postId
          ),
        },
      };
    }),

  /* setGoal: (goalId, data) =>
    set((state) => ({
      goalData: { ...state.goalData, [goalId]: data },
    })), */

  clearStore: () =>
    set({
      sublistData: {},
      goalsBySublist: {},
      goalOrderBySublist: {},
      postsByGoal: {},
      postOrderByGoal: {},
    }),
}));
