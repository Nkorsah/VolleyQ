import { User } from "../types/types";
import { create } from "zustand";

interface UserStore {
  user: User | null;
  justRegistered: boolean;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setJustRegistered: (val: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  justRegistered: false,
  setUser: (user: User) => set({ user }),
   updateUser: (updates) =>
    set((state) => ({ // I do not understand this yet. 
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
  setJustRegistered: (val) => set({ justRegistered: val }),

}));