import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedVenueStore {
  venueID: string | null;
  venueName: string | null;

  setVenue: (venueID: string, venueName: string) => void;
  clearVenue: () => void;
}

export const useSelectedVenueStore = create<SelectedVenueStore>()(
  persist(
    (set) => ({
      venueID: null,
      venueName: null,

      setVenue: (venueID, venueName) =>
        set({
          venueID,
          venueName,
        }),

      clearVenue: () =>
        set({
          venueID: null,
          venueName: null,
        }),
    }),
    {
      name: "selected-venue",
    }
  )
);