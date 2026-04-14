import { useState, useEffect, JSX } from "react";
import Navbar from "../components/Navbar.tsx";
import { useAuth } from "../contexts/authContext/index.tsx";
import { useNavigate } from "react-router-dom";
import { MapComponent } from '../maps/mapcomp';
import { getVenues, type Marker } from '../api/api';
import VenueDetailsView from "./VenueDetailsView";
import { useSelectedVenueStore } from "../store/selectedVenue.ts";

function MapPage(): JSX.Element {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [googleSuggestions, setGoogleSuggestions] = useState<any[]>([]);
  const [previewLocation, setPreviewLocation] = useState<string | null>(null);
  const [venueID, setVenueID] = useState('');
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  const setVenue = useSelectedVenueStore((state) => state.setVenue);

  useEffect(() => {
    const loadData = async () => {
      try {
        const venues = await getVenues();
        setMarkers(venues.map((v) => v.marker));
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, []);

  if (showFullDetails && previewLocation) {
    return <VenueDetailsView />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#fdf2d1]">
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden relative">
        {!previewLocation && (
          <button onClick={() => navigate("/home")} className="absolute top-4 left-4 z-50 text-sm font-bold text-gray-600 hover:underline">
            ← Home
          </button>
        )}

        {!previewLocation ? (
          <>
            <div className="w-1/3 min-w-[300px] bg-white border-r border-gray-200 flex flex-col pt-12"> 
              <div className="p-6">
                <h1 className="text-3xl font-light text-gray-700">Find a Game</h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* ACTIVE VENUES (RED) */}
                <div className="px-6 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50">
                  Active Venues
                </div>
                {markers.map((marker) => (
                  <div key={marker.venueID} onClick={() => { setPreviewLocation(marker.label); setVenueID(marker.venueID); }} className="flex items-center p-4 border-b border-gray-100 hover:bg-red-50 cursor-pointer">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-red-100">❤️</div>
                    <span className="text-sm font-semibold text-gray-800">{marker.label}</span>
                  </div>
                ))}

                {/* SUGGESTED VENUES (YELLOW) */}
                {googleSuggestions.length > 0 && (
                  <>
                    <div className="px-6 py-2 mt-4 text-[10px] font-bold text-yellow-600 uppercase tracking-widest bg-yellow-50">
                      Suggested Nearby
                    </div>
                    {googleSuggestions.map((place) => (
                      <div key={place.place_id} className="flex items-center p-4 border-b border-gray-100 opacity-80 hover:bg-yellow-50 cursor-default">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-yellow-100">
                          {place.suggestionType === 'volleyball court' ? "🏐" : "🏛️"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600">{place.name}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{place.suggestionType} • {place.vicinity}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 relative">
              <MapComponent userId={currentUser?.uid || '123'} onGooglePlacesLoaded={setGoogleSuggestions} />
            </div>
          </>
        ) : (
          /* PREVIEW MODE */
          <div className="flex flex-1">
            <div className="w-1/2 relative border-r border-gray-200">
              <MapComponent userId={currentUser?.uid || '123'} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-4 rounded-full shadow-2xl scale-125 border-4 border-[#f7e49a]">
                  <span className="text-6xl">❤️</span>
                </div>
              </div>
            </div>

            <div className="w-1/2 flex flex-col items-center justify-center p-12 text-center bg-white relative">
              <button onClick={() => { setPreviewLocation(null); setVenueID(''); }} className="absolute top-6 right-8 text-3xl text-gray-400 hover:text-gray-700 font-bold">✕</button>
              <div className="mb-8 scale-150"><span className="text-8xl">❤️</span></div>
              <h2 className="text-4xl font-semibold text-gray-800 mb-2">{previewLocation}</h2>
              <p className="text-gray-500 text-lg mb-10 italic">Official Game Venue</p>
              <button onClick={() => { setVenue(venueID, previewLocation); navigate(`/venue/${encodeURIComponent(previewLocation)}/${venueID}`); }}
                className="px-16 py-4 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-bold hover:bg-[#f2db82] active:scale-95 shadow-md">
                Join Venue!
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MapPage;