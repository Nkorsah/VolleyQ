import { useState, JSX } from "react";
import Navbar from "../components/Navbar.tsx";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";
import MapComponent from '../maps/mapcomp';

function MapPage(): JSX.Element {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [previewLocation, setPreviewLocation] = useState<string | null>(null); // Frame 60
  const [showFullDetails, setShowFullDetails] = useState(false);               // Frame 58

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const locations = Array(8).fill("Pearson & McGonigle Hall");

  // --- FRAME 58: FULL SCREEN DETAILS ---
  if (showFullDetails && previewLocation) {
    return (
      <div className="h-screen flex flex-col bg-[#fdf2d1]">
        <Navbar user={currentUser} onLogout={handleLogout} />
        <main 
          className="flex-1 flex flex-col items-center pt-12 relative bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(253, 242, 209, 0.8), rgba(253, 242, 209, 0.8)), url('https://via.placeholder.com/1200x800?text=Gym+Background')` }}
        >
          <button onClick={() => setShowFullDetails(false)} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
            ← Back to Map
          </button>
          <h1 className="text-4xl font-normal text-gray-800 mb-12">{previewLocation}</h1>
          <div className="flex flex-col gap-6 w-full max-w-md px-6">
            <button className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">Team Signup</button>
            <button className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">Waitlist Queue</button>
            <button className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">Information</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fdf2d1]">
      <Navbar user={currentUser} onLogout={handleLogout} />
      
      <main className="flex flex-1 overflow-hidden">
        {/* --- CONDITIONAL LOGIC FOR SIDEBAR VS PREVIEW --- */}
        {!previewLocation ? (
          /* FRAME 57: Sidebar is visible */
          <>
            <div className="w-1/3 min-w-[300px] bg-white border-r border-gray-200 flex flex-col">
              <div className="p-6">
                <h1 className="text-3xl font-light text-gray-700">Find a Game</h1>
              </div>
              <div className="flex-1 overflow-y-auto">
                {locations.map((name, index) => (
                  <div 
                    key={index} 
                    onClick={() => setPreviewLocation(name)} 
                    className="flex items-center p-4 border-b border-gray-100 hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${index < 2 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      {index < 2 ? "❤️" : "⭐"}
                    </div>
                    <span className="text-sm font-medium text-gray-600">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Standard Map view on the right */}
            <div className="flex-1 relative">
              <MapComponent />
            </div>
          </>
        ) : (
          /* FRAME 60: Sidebar disappears, location is enlarged */
          <div className="flex flex-1">
            {/* Left Half: Map ONLY (Floating Heart Removed) */}
            <div className="w-1/2 relative border-r border-gray-200">
              <MapComponent />
              {/* This is where the overlay used to be. It's now empty. */}
            </div>

            {/* Right Half: Info & Detail Button */}
            <div className="w-1/2 flex flex-col items-center justify-center p-12 text-center bg-white relative">
              <button 
                onClick={() => setPreviewLocation(null)} 
                className="absolute top-6 right-8 text-3xl text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
              
              <div className="mb-8 scale-150">
                <span className="text-8xl">❤️</span>
              </div>
              
              <h2 className="text-3xl font-semibold text-gray-800 mb-2">{previewLocation}</h2>
              <p className="text-gray-500 text-lg mb-10">1800 N Broad St, Philadelphia, PA 19121</p>
              
              <button 
                onClick={() => setShowFullDetails(true)} 
                className="px-12 py-3 bg-[#f7e49a] border border-gray-400 rounded-lg text-lg font-medium hover:bg-[#f2db82] transition-transform active:scale-95"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MapPage;