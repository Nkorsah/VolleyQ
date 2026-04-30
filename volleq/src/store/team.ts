import { create } from 'zustand';
import { Team } from '../types/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "../firebase/firebase-service";


interface TeamState {
  currentTeam: Team | null;
  isLoading: boolean;
  unsubscribe?: () => void;

  // setTeam: (team: Team) => void; // team automatically updates
  resetTeam: () => void;
  subscribeToTeam: (teamID: string) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  currentTeam: null,
  isLoading: false,
  unsubscribe: undefined,

  resetTeam: () => {
    get().unsubscribe?.();

    set({
      currentTeam: null,
      isLoading: false,
      unsubscribe: undefined,
    });
  },

  subscribeToTeam: (teamID: string) => {
    // clean old listener
    get().unsubscribe?.();

    set({ isLoading: true });

    const teamRef = doc(db, "teams", teamID);

    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({
            currentTeam: {
              teamID: snapshot.id,
              ...snapshot.data(),
            } as Team,
            isLoading: false,
          });
        } else {
          set({
            currentTeam: null,
            isLoading: false,
          });
        }
      },
      (error) => {
        console.error("Team Sync Error:", error);
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },
}));
// make a snapshot here. 