// userStore.ts
import { create } from "zustand";
import { UserWithCategory } from "@/types/userWithCategory";

interface UserStore {
  user: UserWithCategory | null;
  setUser: (user: UserWithCategory) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
