import { create } from 'zustand';
import { Team } from '../types/types';

interface TeamState {
  currentTeam: Team | null;
  teamMembers: string[];
  setTeam: (team: Team) => void;
  addMember: (uid: string) => void;
  resetTeam: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,
  teamMembers: [],
  
  setTeam: (team) => set({ currentTeam: team }),
  
  addMember: (uid) => set((state) => ({ 
    teamMembers: [...state.teamMembers, uid] 
  })),
  
  resetTeam: () => set({ currentTeam: null, teamMembers: [] }),
}));

// make a snapshot here. 