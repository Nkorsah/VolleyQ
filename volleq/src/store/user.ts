// import { User } from "../types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  uid: string;
  name: string;
  avatarUrl: string;
  email?: string;
  teamId?: string | null; 
  stats: {
    gamesPlayed: number;
    wins: number;
  };
}

interface UserStore {
  user: User | null;
  justRegistered: boolean;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setJustRegistered: (val: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      justRegistered: false,

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

      setJustRegistered: (val) => set({ justRegistered: val }),
    }),
    {
      name: "user-storage", // key in localStorage
    }
  )
);