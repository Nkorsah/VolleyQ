import { create } from 'zustand';

interface Game {
    id: string;
    location: { lat: number; lng: number; name: string };
    startTime: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Competitive';
    maxPlayers: number;
    currentPlayers: string[];
    hostId: string;
}

interface GameStore {
    games: Game[];
    selectedGame: Game | null;
    filters: {
        skillLevel: string | 'All';
        date: string | null;
    };

    setGames: (games: Game[]) => void;
    selectGame: (game: Game | null) => void;
    setFilters: (filters: Partial<GameStore['filters']>) => void;
    clearFilters: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  games: [],
  selectedGame: null,
  filters: {
    skillLevel: 'All',
    date: null,
  },

  setGames: (games) => set({ games }),
  
  selectGame: (game) => set({ selectedGame: game }),

  setFilters: (newFilters) => 
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

  clearFilters: () => set({ 
    filters: { skillLevel: 'All', date: null } 
  }),
}));