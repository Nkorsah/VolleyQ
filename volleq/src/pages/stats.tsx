import type { JSX } from "react";
import Navbar from "../components/Navbar.tsx";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";
import GeminiComponent from '../gemini/geminicomp';

function GeminiPage(): JSX.Element {
  const { currentUser, userLoggedIn, loading } = useAuth();
  // The above details gets the current user information.

  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await doSignOut(); // wait for sign out to complete
      console.log("User logged out successfully");
      navigate("/"); // now safe to redirect
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar/>
      {/* Hero
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl mb-10">This is the map page</h1>
      </main> */}
      <GeminiComponent/>
    </div>
  );
}

export default GeminiPage;
