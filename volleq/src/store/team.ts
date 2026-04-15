import { create } from 'zustand';
import { Team } from '../types/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "../firebase/firebase-service";

interface TeamState {
  currentTeam: Team | null;
  teamMembers: string[];
  setTeam: (team: Team) => void;
  addMember: (uid: string) => void;
  resetTeam: () => void;
  subscribeToTeam: (teamID: string) => () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,
  teamMembers: [],
  
  setTeam: (team) => set({ currentTeam: team }),
  
  addMember: (uid) => set((state) => ({ 
    teamMembers: [...state.teamMembers, uid] 
  })),
  
  resetTeam: () => set({ currentTeam: null, teamMembers: [] }),

  subscribeToTeam: (teamID: string) => {
    // Reference the team document using the unique teamID
    const teamRef = doc(db, "teams", teamID);
    
    // Set up the real-time listener (snapshot)
    const unsubscribe = onSnapshot(
      teamRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          // Update the store with the latest data from Firestore
          set({ currentTeam: snapshot.data() as Team });
        } else {
          // If the team is deleted, reset the local state
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