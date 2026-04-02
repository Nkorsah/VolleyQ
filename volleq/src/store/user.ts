import { User } from "../types/types";
import { create } from "zustand";

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
   updateUser: (updates) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...updates,
            stats: {
              ...state.user.stats,
              ...updates.stats,
            },
          }
        : null,
    })),
  clearUser: () => set({ user: null }),

}));