import { useState, JSX } from "react";
import Navbar from "../components/Navbar.tsx";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";
import { MapComponent } from '../maps/mapcomp';
import TeamsPage from "../pages/TeamsPage";
import WaitlistPage from "../pages/WaitlistPage";
import HostCourtPage from "../pages/HostCourtPage";
import { getMarkers } from "../api/markers.tsx";
import { getVenues, type Marker } from '../api/api';
import { useEffect } from "react";
import { useMemo } from "react";
import VenueDetailsView from "./VenueDetailsView";
import { useSelectedVenueStore } from "../store/selectedVenue.ts";


function MapPage(): JSX.Element {

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [previewLocation, setPreviewLocation] = useState<string | null>(null);
  const [venueID, setVenueID] = useState(''); // set venue by marker
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const setVenue  = useSelectedVenueStore((state) => state.setVenue)
    useEffect(() => {
    const loadData = async () => {
      try {
        const venues = await getVenues();

        // venues.forEach((venue) => {
        //   // console.log(venue);
        //   setMarkers(venue.marker);
        // });
        const allMarkers = venues.map((venue) => venue.marker);
        setMarkers(allMarkers);


        // const markers = await getMarkers();
      } catch (err) {
        setError("Failed to load data");
      }
    };

    loadData();
  }, []);
  
  // get all markers by label. 

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const locations = markers // I want the label, description and venue id. 
  // locations can be filled by the marker details such as the marker name

  // --- FRAME 58: FULL SCREEN DETAILS ---
  const [activeSubView, setActiveSubView] = useState<"menu" | "teams" | "waitlist" | "host">("menu");

  if (showFullDetails && previewLocation) {
  return (
    <VenueDetailsView
    />
  );
}

  return (
    <div className="h-screen flex flex-col bg-[#fdf2d1]">
      <Navbar/>
      
      <main className="flex flex-1 overflow-hidden relative">
        {/* --- MATCHED "BACK TO MAP" STYLING FOR HOME --- */}
        {!previewLocation && (
          <button 
            onClick={() => navigate("/home")} 
            className="absolute top-4 left-4 z-50 text-sm font-bold text-gray-600 hover:underline"
          >
            ← Home
          </button>
        )}

        {!previewLocation ? (
          /* FRAME 57: Sidebar view */
          <>
            {/* Keeping pt-12 to ensure "Find a Game" doesn't overlap the button. turn these into components*/}
            <div className="w-1/3 min-w-[300px] bg-white border-r border-gray-200 flex flex-col pt-12"> 
              <div className="p-6">
                <h1 className="text-3xl font-light text-gray-700">Find a Game</h1>
              </div>
              <div className="flex-1 overflow-y-auto">
                {markers.map((marker, index) => (
                  <div 
                    key={marker.venueID} 
                    onClick={() => {setPreviewLocation(marker.label)
                      setVenueID(marker.venueID)
                    }} 
                    className="flex items-center p-4 border-b border-gray-100 hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${index < 2 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      {index < 2 ? "❤️" : "⭐"}
                    </div>
                    <span className="text-sm font-medium text-gray-600">{marker.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <MapComponent userId='1234567'/>
            </div>
          </>
        ) : (
          /* FRAME 60: Enlarged Preview (unchanged) */
          <div className="flex flex-1">
            <div className="w-1/2 relative border-r border-gray-200">
              <MapComponent userId='1234567'/>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-4 rounded-full shadow-2xl scale-125 border-4 border-[#f7e49a]">
                  <span className="text-6xl">❤️</span>
                </div>
              </div>
            </div>

            <div className="w-1/2 flex flex-col items-center justify-center p-12 text-center bg-white relative">
              <button 
                onClick={() => {setPreviewLocation(null)
                  setVenueID('')}
                } 
                className="absolute top-6 right-8 text-3xl text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
              
              <div className="mb-8 scale-150">
                <span className="text-8xl">❤️</span>
              </div>
              
              <h2 className="text-3xl font-semibold text-gray-800 mb-2">{previewLocation}</h2>
              {/* DESCRIPTION ADDED HERE */}
<p className="text-gray-600 text-md mb-4">
  { "No description available for this venue."}
</p>
              <p className="text-gray-500 text-lg mb-10">1800 N Broad St, Philadelphia, PA 19121</p>
              
              <button 
                onClick={() => {
                  
                  setVenue(venueID,previewLocation)
                  navigate(`/venue/${encodeURIComponent(previewLocation)}/${venueID}`)}} // venueID
                className="px-12 py-3 bg-[#f7e49a] border border-gray-400 rounded-lg text-lg font-medium hover:bg-[#f2db82] transition-transform active:scale-95"
              >
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