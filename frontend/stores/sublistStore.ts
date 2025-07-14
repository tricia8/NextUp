// stores/sublistStore.ts
import { Goal } from "@/types/goal";
import { Sublist } from "@/types/sublist";
import { create } from "zustand";

type SublistWithoutId = Omit<Sublist, "id"> & {
  ownerId: string;
};

interface SublistState {
  sublistData: { [sublistId: string]: SublistWithoutId };
  goalsBySublist: Record<string, Goal[]>;

  // goalData: { [goalId: string]: Goal };
  setSublist: (
    sublistId: string,
    data: Omit<Sublist, "id">,
    ownerId: string
  ) => void;
  setGoalsForSublist: (sublistId: string, goals: Goal[]) => void;
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

  setSublist: (sublistId, data, ownerId) =>
    set((state) => ({
      sublistData: {
        ...state.sublistData,
        [sublistId]: { ...data, ownerId },
      },
    })),

  setGoalsForSublist: (sublistId, goals) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: goals,
      },
    })),

  addGoalToSublist: (sublistId, goal) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: [goal, ...(state.goalsBySublist[sublistId] || [])],
      },
    })),

  removeGoalFromSublist: (sublistId, goalId) =>
    set((state) => ({
      goalsBySublist: {
        ...state.goalsBySublist,
        [sublistId]: (state.goalsBySublist[sublistId] || []).filter(
          (goal) => goal.id !== goalId
        ),
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

  /* setGoal: (goalId, data) =>
    set((state) => ({
      goalData: { ...state.goalData, [goalId]: data },
    })), */

  clearStore: () => set({ sublistData: {}, goalsBySublist: {} }),
}));
