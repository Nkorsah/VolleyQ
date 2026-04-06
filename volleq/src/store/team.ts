import { create } from 'zustand';

interface TeamState {
  currentTeam: string | null;
  teamMembers: string[];
  setTeam: (teamName: string) => void;
  addMember: (uid: string) => void;
  resetTeam: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,
  teamMembers: [],
  
  setTeam: (teamName) => set({ currentTeam: teamName }),
  
  addMember: (uid) => set((state) => ({ 
    teamMembers: [...state.teamMembers, uid] 
  })),
  
  resetTeam: () => set({ currentTeam: null, teamMembers: [] }),
}));