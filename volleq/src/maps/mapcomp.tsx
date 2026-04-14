import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { addMarker, getMarkers, removeMarker, canDelete, createVenue } from '../api/markers';
import type { Marker} from '../api/api';
import { getVenues } from '../api/api';
import { CreateVenueModal } from '../components/CreateVenueModal';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

type Props = {
  userId: string;
};

export function MapComponent({ userId }: Props) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selected, setSelected] = useState<Marker | null>(null);
  const [label, setLabel] = useState('');
  const [venue_description, setVenue_description] = useState('');
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   getMarkers()
  //     .then(setMarkers)
  //     .catch(() => setError('Failed to load markers'));
  // }, []);

 useEffect(() => {
    const loadData = async () => {
      try {
        const venues = await getVenues();

      const allMarkers = venues.map((venue) => venue.marker);
      setMarkers(allMarkers);

        // const markers = await getMarkers();
      } catch (err) {
        setError("Failed to load data");
      }
    };

    loadData();
  }, []);
  
  
  const handleMapClick = (e: any) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    setPendingPos({ lat, lng });
    setLabel('');
    setSelected(null);
  };

  const handleSaveMarker = async () => {
    if (!pendingPos) return;
    try {
      // create venue then add marker
      const newVenue = await createVenue({
        venue_name: label,
        venue_description
      })

      console.log('venue created!')

      const newMarker = await addMarker({ // add marker will
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        label: label || 'New Marker',
        venueID: newVenue.venueID
      });

      setMarkers(prev => [...prev, newMarker]);

      setPendingPos(null);
      setLabel("");
      setVenue_description("");
    } catch (err) {
        setError('Failed to save marker'); 
        setPendingPos(null);  
  }
};

  const handleDelete = async (markerId: string) => {
    try {
      await removeMarker(markerId);
      setMarkers(prev => prev.filter(m => m.id !== markerId));
      setSelected(null);
    } catch (err) {
      setError('Failed to delete marker');
    }
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      {error && <p>{error}</p>}

      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={{ lat: 39.9812, lng: -75.1554 }}
          defaultZoom={15}
          onClick={handleMapClick}
        >
          {/* Existing markers */}
          {markers.map(marker => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelected(marker)}
            >
              <Pin />
            </AdvancedMarker>
          ))}

          {/* Info window for selected marker */}
          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div>
                <p><strong>{selected.label}</strong></p>
                <p>Added by: {selected.createdBy}</p>
                {canDelete(selected, userId) && (
                  <button onClick={() => handleDelete(selected.id)}>
                    Delete
                  </button>
                )}
              </div>
            </InfoWindow>
          )}

          {/* Pending marker placement and styling the create venue window*/}
          {/* {pendingPos && (
            <InfoWindow
              position={pendingPos}
              onCloseClick={() => setPendingPos(null)}
            >
              <div className="w-64 p-4 flex flex-col gap-3">
    
                <h2 className="text-lg font-semibold text-center text-gray-800">
                  Create Venue
                </h2>

                <input
                  type="text"
                  placeholder="Venue name"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <input
                  type="text"
                  placeholder="Venue description"
                  value={venue_description}
                  onChange={(e) => setVenue_description(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <div className="flex justify-between mt-2">
                  <button
                    onClick={handleSaveMarker}
                    className="px-4 py-2 bg-[#f7e49a] border border-gray-400 rounded-md text-sm font-medium hover:bg-[#f2db82]"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setPendingPos(null)}
                    className="px-4 py-2 text-sm text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </InfoWindow>
          )} */}
        </Map>
        <CreateVenueModal
          open={!!pendingPos}
          lat={pendingPos?.lat ?? null}
          lng={pendingPos?.lng ?? null}
          label={label}
          venueDescription={venue_description}
          setLabel={setLabel}
          setVenueDescription={setVenue_description}
          onClose={() => setPendingPos(null)}
          onSave={handleSaveMarker}
        />
      </APIProvider>
    </div>
  );
}