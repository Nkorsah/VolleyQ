// src/pages/Home.tsx
import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
// import type { AppUser } from "../../../server/AppUser";
import { useUserStore } from "../store/user.ts";
import { useTeamStore } from "../store/team.ts";
import { doSignOut } from "../firebase/auth"; 


const Home: React.FC = () => {
  const navigate = useNavigate();

  // Pull user from Zustand for the welcome message
  const user = useUserStore((state) => state.user);
  
  // Pull team info from Zustand
  const { currentTeam, teamMembers } = useTeamStore((state) => ({
    currentTeam: state.currentTeam,
    teamMembers: state.teamMembers,
  }));

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      {/* navbar component now manages user state and logout logic internally
      */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl mb-6">
          Welcome back {user?.name || "Player"}!
        </h1>

        {/* display team status */}
        <div className="mb-10">
          {currentTeam ? (
            <p className="text-xl">
              Team: <span className="font-bold">{currentTeam}</span> 
              ({teamMembers.length} members)
            </p>
          ) : (
            <p className="text-xl italic text-gray-700">No team joined yet</p>
          )}
        </div>

        <button
          className="px-12 py-5 bg-yellow-300 rounded-2xl border-2 border-black text-2xl hover:scale-105 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => navigate("/map-page")}
        >
          Find a Game
        </button>
      </main>
    </div>
  );
};

export default Home;