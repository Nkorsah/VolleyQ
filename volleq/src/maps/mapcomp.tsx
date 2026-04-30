import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { addMarker, removeMarker, createVenue } from '../api/markers';
import type { Marker } from '../api/api';
import { getVenues } from '../api/api';
import { CreateVenueModal } from '../components/CreateVenueModal';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const PlacesManager = ({ onPlacesFound }: { onPlacesFound: (places: any[]) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const service = new google.maps.places.PlacesService(map);
    const searchTypes = ['volleyball court', 'recreation center'];
    
    const performSearch = async () => {
      let allResults: any[] = [];
      const placeIds = new Set();

      searchTypes.forEach((query) => {
        const request: google.maps.places.TextSearchRequest = {
          location: map.getCenter(),
          radius: 5000,
          query: query
        };

        service.textSearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
              if (!placeIds.has(place.place_id)) {
                placeIds.add(place.place_id);
                allResults.push({ ...place, suggestionType: query });
              }
            });
            onPlacesFound([...allResults]);
          }
        });
      });
    };

    performSearch();
  }, [map, onPlacesFound]);

  return null;
};

export function MapComponent({ userId, onGooglePlacesLoaded, onVenueActivated }: { 
  userId: string, 
  onGooglePlacesLoaded?: (places: any[]) => void,
  onVenueActivated?: () => void 
}) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [googleMarkers, setGoogleMarkers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  
  const [label, setLabel] = useState('');
  const [venue_description, setVenue_description] = useState('');

  const loadData = async () => {
    try {
      const venues = await getVenues();
      // FIX 1: Filter out venues that don't have a valid marker object or coordinates
      const validMarkers = venues
        .filter(v => v.marker && typeof v.marker.lat === 'number' && typeof v.marker.lng === 'number')
        .map(v => v.marker);
        
      setMarkers(validMarkers);
    } catch (err) { 
      console.error("Map Load Error:", err); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePlacesFound = useCallback((places: any[]) => {
    setGoogleMarkers(places);
    if (onGooglePlacesLoaded) onGooglePlacesLoaded(places);
  }, [onGooglePlacesLoaded]);

  const handleActivateLocation = async (place: any) => {
    try {
      const newVenue = await createVenue({ 
        venue_name: place.name, 
        venue_description: place.formatted_address || place.vicinity 
      });

      await addMarker({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        label: place.name,
        venueID: newVenue.venueID
      });

      setSelected(null);
      await loadData(); 
      if (onVenueActivated) onVenueActivated(); 
    } catch (err) {
      console.error("Activation failed", err);
    }
  };

  const handleCreateLocation = async () => {
    if (!pendingPos) return;
    try {
      const newVenue = await createVenue({ 
        venue_name: label, 
        venue_description: venue_description
      });

      await addMarker({
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        label: label,
        venueID: newVenue.venueID
      });

      setSelected(null);
      await loadData(); 
      // if (onVenueActivated) onVenueActivated(); 
    } catch (err) {
      console.error("Activation failed", err);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
        <Map 
          mapId={MAP_ID} 
          defaultCenter={{ lat: 39.9812, lng: -75.1554 }} 
          defaultZoom={14} 
          onClick={(e: any) => setPendingPos({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng })}
        >
          <PlacesManager onPlacesFound={handlePlacesFound} />

          {/* ACTIVE (RED) - FIX 2: Added safety check for marker existence */}
          {markers?.map(marker => marker && (
            <AdvancedMarker 
              key={marker.id || marker.venueID} 
              position={{ lat: marker.lat, lng: marker.lng }} 
              onClick={() => setSelected({ ...marker, isCustom: true })}
            >
              <div style={{
                background: '#ef4444',
                border: '2px solid #b91c1c',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                transform: 'rotate(45deg)',
                fontSize: '18px',
                lineHeight: 1,
                }}>
                  🏐
                </span>
              </div>
            </AdvancedMarker>
          ))}

          {googleMarkers?.map(place => place?.geometry?.location && (
            <AdvancedMarker 
              key={place.place_id} 
              position={place.geometry.location} 
              onClick={() => setSelected({ ...place, isCustom: false })}
            >
              <Pin background={'#f7e49a'} borderColor={'#ca8a04'} glyphColor={'#854d0e'} />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow 
              position={selected.geometry?.location || { lat: selected.lat, lng: selected.lng }} 
              onCloseClick={() => setSelected(null)}
            >
              <div className="p-2 min-w-[180px]">
                <p className="font-bold text-gray-800">{selected.name || selected.label}</p>
                <p className="text-[10px] text-gray-500 mb-2">{selected.vicinity || "Official Venue"}</p>
                
                {!selected.isCustom && (
                  <button 
                    onClick={() => handleActivateLocation(selected)}
                    className="w-full py-2 bg-[#f7e49a] border border-gray-400 rounded text-[11px] font-bold hover:bg-[#f2db82] transition-colors"
                  >
                    + Activate Venue
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
        <CreateVenueModal 
          open={!!pendingPos} 
          lat={pendingPos?.lat ?? null} 
          lng={pendingPos?.lng ?? null} 
          label={label} 
          setLabel={setLabel} 
          venueDescription={venue_description} 
          setVenueDescription={setVenue_description} 
          onClose={() => setPendingPos(null)} 
          onSave={() => handleCreateLocation()} 
        />
      </APIProvider>
    </div>
  );
}