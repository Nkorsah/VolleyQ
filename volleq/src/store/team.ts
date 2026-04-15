import { create } from 'zustand';
import { Team } from '../types/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "../firebase/firebase-service";
interface TeamState {
  currentTeam: Team | null;

  setTeam: (team: Team) => void;
  resetTeam: () => void;

  subscribeToTeam: (teamID: string) => () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,

  setTeam: (team) => set({ currentTeam: team }),

  resetTeam: () => set({ currentTeam: null }),

  subscribeToTeam: (teamID: string) => {
    const teamRef = doc(db, "teams", teamID);

    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ currentTeam: snapshot.data() as Team });
        } else {
          set({ currentTeam: null });
        }
      },
      (error) => {
        console.error("Team Sync Error:", error);
      }
    );

    return unsubscribe;
  }
}));

// make a snapshot here. 