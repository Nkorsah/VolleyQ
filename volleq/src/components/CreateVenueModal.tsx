// components/CreateVenueModal.tsx
import { useEffect } from "react";

type Props = {
  open: boolean;
  lat: number | null;
  lng: number | null;
  label: string;
  venueDescription: string;
  setLabel: (v: string) => void;
  setVenueDescription: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function CreateVenueModal({
  open,
  lat,
  lng,
  label,
  venueDescription,
  setLabel,
  setVenueDescription,
  onSave,
  onClose,
}: Props) {
  useEffect(() => {
    if (open) {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [open]);

  if (!open || lat == null || lng == null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 bg-white rounded-xl shadow-lg p-5 flex flex-col gap-3">
        
        <h2 className="text-lg font-semibold text-center">
          Create Venue
        </h2>

        <input
          type="text"
          placeholder="Venue name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <input
          type="text"
          placeholder="Venue description"
          value={venueDescription}
          onChange={(e) => setVenueDescription(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <div className="flex justify-between mt-2">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-[#f7e49a] border rounded-md text-sm font-medium hover:bg-[#f2db82]"
          >
            Save
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}