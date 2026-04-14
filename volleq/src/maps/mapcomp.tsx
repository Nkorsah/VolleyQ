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
            // Update parent with unique combined results
            onPlacesFound([...allResults]);
          }
        });
      });
    };

    performSearch();
  }, [map, onPlacesFound]);

  return null;
};

export function MapComponent({ userId, onGooglePlacesLoaded }: { userId: string, onGooglePlacesLoaded?: (places: any[]) => void }) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [googleMarkers, setGoogleMarkers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  
  const [label, setLabel] = useState('');
  const [venue_description, setVenue_description] = useState('');

  useEffect(() => {
    getVenues().then(venues => setMarkers(venues.map(v => v.marker))).catch(console.error);
  }, []);

  const handlePlacesFound = useCallback((places: any[]) => {
    setGoogleMarkers(places);
    if (onGooglePlacesLoaded) onGooglePlacesLoaded(places);
  }, [onGooglePlacesLoaded]);

  const handleMapClick = (e: any) => {
    setPendingPos({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
  };

  const handleSaveMarker = async () => {
    if (!pendingPos) return;
    try {
      const newVenue = await createVenue({ venue_name: label, venue_description });
      const newMarker = await addMarker({
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        label: label || 'New Marker',
        venueID: newVenue.venueID
      });
      setMarkers(prev => [...prev, newMarker]);
      setPendingPos(null);
      setLabel("");
      setVenue_description("");
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
        <Map mapId={MAP_ID} defaultCenter={{ lat: 39.9812, lng: -75.1554 }} defaultZoom={14} onClick={handleMapClick}>
          <PlacesManager onPlacesFound={handlePlacesFound} />

          {/* CUSTOM MARKERS - RED */}
          {markers.map(marker => (
            <AdvancedMarker key={marker.id} position={{ lat: marker.lat, lng: marker.lng }} onClick={() => setSelected(marker)}>
              <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'white'} />
            </AdvancedMarker>
          ))}

          {/* GOOGLE MARKERS - YELLOW */}
          {googleMarkers.map(place => (
            <AdvancedMarker key={place.place_id} position={place.geometry.location} onClick={() => setSelected(place)}>
              <Pin background={'#f7e49a'} borderColor={'#ca8a04'} glyphColor={'#854d0e'} />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow position={selected.geometry?.location || { lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
              <div className="p-1">
                <p className="font-bold">{selected.name || selected.label}</p>
                <p className="text-xs">{selected.vicinity || `Custom Venue`}</p>
              </div>
            </InfoWindow>
          )}
        </Map>
        <CreateVenueModal open={!!pendingPos} lat={pendingPos?.lat ?? null} lng={pendingPos?.lng ?? null} label={label} setLabel={setLabel} venueDescription={venue_description} setVenueDescription={setVenue_description} onClose={() => setPendingPos(null)} onSave={handleSaveMarker} />
      </APIProvider>
    </div>
  );
}