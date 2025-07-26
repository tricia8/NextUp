// stores/sublistStore.ts
import { Goal } from "@/types/goal";
import { PostWithPending } from "@/types/postWithPending";
import { Sublist } from "@/types/sublist";
import { create } from "zustand";

interface SublistState {
  sublistData: { [sublistId: string]: Sublist };
  sublistOrder: string[]; // store array of sublist IDs
  goalsBySublist: Record<string, Record<string, Goal>>;
  goalOrderBySublist: Record<string, string[]>; // store array of goal IDs for each sublist
  postsByGoal: Record<string, Record<string, PostWithPending>>;
  postOrderByGoal: Record<string, string[]>; // store array of post IDs for each goal

  setSublists: (
    sublistRecord: Record<string, Sublist>,
    sublistOrder: string[]
  ) => void;
  addSublist: (sublistId: string, data: Sublist, ownerId: string) => void;
  updateCachedSublist: (
    sublistId: string,
    data: Sublist,
    ownerId: string
  ) => void;
  updateSublistField: <K extends keyof Sublist>(
    sublistId: string,
    key: K,
    value: Sublist[K]
  ) => void;
  removeSublist: (sublistId: string) => void;

  setGoalsForSublist: (
    sublistId: string,
    goalsRecord: Record<string, Goal>,
    goalOrder: string[]
  ) => void;

  updateGoalForSublist: (sublistId: string, goal: Goal) => void;
  addGoalToSublist: (sublistId: string, goal: Goal) => void;

  removeGoalFromSublist: (sublistId: string, goalId: string) => void;

  setPostsForGoal: (
    goalId: string,
    postsRecord: Record<string, PostWithPending>,
    postOrder: string[]
  ) => void;

  addPostToGoal: (goalId: string, post: PostWithPending) => void;

  updatePostForGoal: (goalId: string, post: PostWithPending) => void;

  removePostFromGoal: (goalId: string, postId: string) => void;

  replacePostId: (
    goalId: string,
    oldPostId: string,
    newPost: PostWithPending
  ) => void;

  clearStore: () => void;
}

export const useSublistStore = create<SublistState>()((set) => ({
  sublistData: {},
  sublistOrder: [],
  goalsBySublist: {},
  goalOrderBySublist: {},
  postsByGoal: {},
  postOrderByGoal: {},

  setSublists: (sublistRecord, sublistOrder) =>
    set((state) => ({
      sublistData: sublistRecord,
      sublistOrder: sublistOrder,
    })),

  addSublist: (sublistId, data, ownerId) =>
    set((state) => {
      const alreadyExists = state.sublistOrder.includes(sublistId);

      return {
        sublistData: {
          ...state.sublistData,
          [sublistId]: { ...data, ownerId },
        },
        sublistOrder: alreadyExists
          ? state.sublistOrder
          : [sublistId, ...state.sublistOrder],
      };
    }),

  updateCachedSublist: (sublistId, data, ownerId) =>
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

  removeSublist: (sublistId) =>
    set((state) => {
      const updatedSublists = {
        ...(state.sublistData || {}),
      };
      delete updatedSublists[sublistId];

      return {
        sublistData: updatedSublists,
        sublistOrder: state.sublistOrder.filter((id) => id !== sublistId),
      };
    }),

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

  updateGoalForSublist: (sublistId, goal) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: {
          ...(state.goalsBySublist[sublistId] || {}),
          [goal.id]: goal,
        },
      },
    })),

  addGoalToSublist: (sublistId, goal) =>
    set((state) => {
      const alreadyExists = state.goalOrderBySublist[sublistId]?.includes(
        goal.id
      );

      return {
        goalsBySublist: {
          ...state.goalsBySublist,
          [sublistId]: { ...state.goalsBySublist[sublistId], [goal.id]: goal },
        },
        goalOrderBySublist: alreadyExists
          ? state.goalOrderBySublist
          : {
              ...state.goalOrderBySublist,
              [sublistId]: [
                goal.id,
                ...(state.goalOrderBySublist[sublistId] || []),
              ],
            },
      };
    }),

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
    set((state) => {
      const alreadyExists = state.postOrderByGoal[goalId]?.includes(post.id);

      return {
        postsByGoal: {
          ...state.postsByGoal,
          [goalId]: {
            ...(state.postsByGoal[goalId] || {}),
            [post.id]: post,
          },
        },
        postOrderByGoal: alreadyExists
          ? state.postOrderByGoal
          : {
              ...state.postOrderByGoal,
              [goalId]: [post.id, ...(state.postOrderByGoal[goalId] ?? [])],
            },
      };
    }),

  updatePostForGoal: (goalId, post) =>
    set((state) => ({
      postsByGoal: {
        ...state.postsByGoal,
        [goalId]: {
          ...(state.postsByGoal[goalId] || {}),
          [post.id]: post,
        },
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

  replacePostId: (goalId, oldPostId, newPost) =>
    set((state) => {
      const posts = { ...state.postsByGoal[goalId] };
      const order = [...(state.postOrderByGoal[goalId] ?? [])];

      delete posts[oldPostId];
      posts[newPost.id] = newPost;

      const index = order.indexOf(oldPostId);
      if (index !== -1) order[index] = newPost.id;

      return {
        postsByGoal: {
          ...state.postsByGoal,
          [goalId]: posts,
        },
        postOrderByGoal: {
          ...state.postOrderByGoal,
          [goalId]: order,
        },
      };
    }),

  clearStore: () =>
    set({
      sublistData: {},
      sublistOrder: [],
      goalsBySublist: {},
      goalOrderBySublist: {},
      postsByGoal: {},
      postOrderByGoal: {},
    }),
}));
