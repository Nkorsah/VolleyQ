// src/pages/Home.tsx
import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import type { AppUser } from "../../../server/AppUser";

type HomeProps = {
  user?: AppUser | null;
  onLogout?: () => void;
};

const Home: React.FC<HomeProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar user={user} onLogout={onLogout} />

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl mb-10">Welcome back Christine!</h1>

        <button
          className="px-12 py-5 bg-yellow-300 rounded-2xl border-2 border-black text-2xl hover:scale-105 transition-transform"
          onClick={() => navigate("/map-page")}
        >
          Find a Game
        </button>
      </main>
    </div>
  );
};

export default Home;