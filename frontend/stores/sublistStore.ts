// stores/sublistStore.ts
import { Goal } from "@/types/goal";
import { Sublist } from "@/types/sublist";
import { create } from "zustand";

type SublistWithoutId = Omit<Sublist, "id"> & {
  ownerId: string;
};

interface SublistState {
  sublistData: { [sublistId: string]: SublistWithoutId };
  goalsBySublist: Record<string, Record<string, Goal>>;
  goalOrderBySublist: Record<string, string[]>; // store array of goal IDs for each sublist

  // goalData: { [goalId: string]: Goal };
  setSublist: (
    sublistId: string,
    data: Omit<Sublist, "id">,
    ownerId: string
  ) => void;
  setGoalsForSublist: (
    sublistId: string,
    goalsRecord: Record<string, Goal>,
    goalOrder: string[]
  ) => void;
  addGoalToSublist: (sublistId: string, goal: Goal) => void;
  // setGoal: (goalId: string, data: Goal) => void;
  removeGoalFromSublist: (sublistId: string, goalId: string) => void;
  updateSublistField: <K extends keyof SublistWithoutId>(
    sublistId: string,
    key: K,
    value: SublistWithoutId[K]
  ) => void;

  clearStore: () => void;
}

export const useSublistStore = create<SublistState>()((set) => ({
  sublistData: {},
  goalsBySublist: {},
  goalOrderBySublist: {},

  setSublist: (sublistId, data, ownerId) =>
    set((state) => ({
      sublistData: {
        ...state.sublistData,
        [sublistId]: { ...data, ownerId },
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

  /* setGoal: (goalId, data) =>
    set((state) => ({
      goalData: { ...state.goalData, [goalId]: data },
    })), */

  clearStore: () => set({ sublistData: {}, goalsBySublist: {} }),
}));
