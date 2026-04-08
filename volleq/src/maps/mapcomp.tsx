import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { addMarker, getMarkers, removeMarker, canDelete } from '../api/markers';
import type { Marker } from '../api/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

type Props = {
  userId: string;
};

export function MapComponent({ userId }: Props) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selected, setSelected] = useState<Marker | null>(null);
  const [label, setLabel] = useState('');
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarkers()
      .then(setMarkers)
      .catch(() => setError('Failed to load markers'));
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
      const newMarker = await addMarker({
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        label: label || 'New Marker'
      });
      setMarkers(prev => [...prev, newMarker]);
      setPendingPos(null);
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
          defaultZoom={12}
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

          {/* Pending marker placement */}
          {pendingPos && (
            <InfoWindow
              position={pendingPos}
              onCloseClick={() => setPendingPos(null)}
            >
              <div>
                <input
                  type="text"
                  placeholder="Marker label"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
                <button onClick={handleSaveMarker}>Save</button>
                <button onClick={() => setPendingPos(null)}>Cancel</button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}