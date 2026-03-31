import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
// Double-check these paths match your folder structure exactly!
import Navbar from "../components/Navbar"; 
import { useAuth } from "../contexts/authContext/index"; 
import { doSignOut } from "../firebase/auth";

function Home(): JSX.Element {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Prevent accessing properties of null if the user isn't loaded yet
  if (loading) {
    return <div className="h-screen bg-[#FDF0B4]" />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#FDF0B4] font-sans">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-medium text-black mb-16">
          Welcome back {currentUser?.name || "Player"}!
        </h1>

        <button 
          onClick={() => navigate("/map-page")}
          className="text-4xl px-16 py-8 rounded-[30px] border border-black bg-[#FFF49C] hover:bg-black/5 transition-colors shadow-sm"
        >
          Find a Game
        </button>
      </main>
    </div>
  );
}

export default Home;