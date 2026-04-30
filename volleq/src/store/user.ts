// import { User } from "../types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { db } from "../firebase/firebase-service";
import { useEffect } from "react";
import { User } from "../types/types";

// export interface User {
//   uid: string;
//   name: string;
//   avatarUrl: string;
//   email?: string;
//   teamId?: string | null; 
//   stats: {
//     gamesPlayed: number;
//     wins: number;
//   };
// }

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
    immer((set) => ({
      user: null,
      justRegistered: false,

      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => {
          if (!state.user) return;

          if (updates.stats) {
            Object.assign(state.user.stats, updates.stats);
          }

          const { stats, ...rest } = updates;
          Object.assign(state.user, rest);
        }),

      clearUser: () => set({ user: null }),

      setJustRegistered: (val) => set({ justRegistered: val }),
    })),
    { name: "user-storage" }
  )
);

// snapshot. updating the user logic: 

import { doc, onSnapshot } from "firebase/firestore";


export const useUserSync = () => { // syncs changes from firebase 
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);

  // Check if Zustand store has hydrated
  const hasHydrated = useUserStore.persist.hasHydrated();

  useEffect(() => {
    // Exit early if store not hydrated or user not ready
    if (!hasHydrated || !user?.userID) {
      console.log("useUserSync: waiting for hydration or user...");
      return;
    }

    console.log(" Attaching Firestore listener for:", user.userID);

    const unsubscribe = onSnapshot(
      doc(db, "users", user.userID),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<User>;
          console.log(" Snapshot fired:", data);
          updateUser(data);
        } else {
          console.log(" User document does not exist in Firestore!");
        }
      }
    );

    return () => unsubscribe();
  }, [hasHydrated, user?.userID, updateUser]);
};