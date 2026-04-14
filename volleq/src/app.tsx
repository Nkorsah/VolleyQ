import type { JSX } from "react";
import Navbar from "./components/Navbar";
import { useAuth } from './contexts/authContext/index.tsx';
import { doSignOut } from './firebase/auth.ts';
import { useNavigate } from "react-router-dom";
import { useUserStore, useUserSync } from "./store/user.ts";
import volleyball from '../images/volleyball_PNG52.png'
import "./index.css"

function App(): JSX.Element {
  // const { currentUser, userLoggedIn, loading} = useAuth();
  useUserSync();
  
  const navigate = useNavigate();
  // still have to merge the user. 
  const currentUser = useUserStore((state) => state.user)// assuming that user is already logged in. 

  console.log(`user is: ${JSON.stringify(currentUser)}`)

  // const handleLogout = async () => {
  //   try {
  //     await doSignOut();
  //     console.log("User logged out successfully");
  //     navigate("/"); // go to login
  //   } catch (error) {
  //     console.error("Error logging out:", error);
  //   }
  // };

  return (
  <div className="h-screen flex flex-col bg-[#e6d6a6]">
    <Navbar />

    {/* Hero */}
    <main className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Volleyball Background */}
      <img
        src={volleyball}
        alt="Background Volleyball"
        className="absolute top-1/2 left-1/2 w-128 h-128 opacity-20 animate-spin-slow -translate-x-1/2 -translate-y-1/2 z-0"
      />

      {/* Text */}
      <h1 className="text-5xl mb-10 relative z-10">
        Welcome back {currentUser?.name || "Player"}!
      </h1>

      <button
        onClick={() => navigate("/map")}
        className="text-2xl px-12 py-5 rounded-2xl border-2 border-black bg-[#f2e28d] hover:scale-105 transition-transform relative z-10"
      >
        Find a Game
      </button>
    </main>
  </div>
);
}

export default App;