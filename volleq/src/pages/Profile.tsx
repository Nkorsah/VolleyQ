// src/pages/Profile.tsx
import type { JSX } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";

function Profile(): JSX.Element {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await doSignOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl mb-8">Edit Profile</h1>
        <div className="w-96 bg-[#f5e7b2] p-8 rounded-xl shadow-md flex flex-col gap-4">
          <div>
            <label className="block font-semibold">Full Name</label>
            <input className="w-full p-2 rounded-lg border" placeholder={currentUser?.name || "Christine Smith"} />
          </div>
          <div>
            <label className="block font-semibold">Email</label>
            <input className="w-full p-2 rounded-lg border" placeholder={currentUser?.email || "christine@email.com"} />
          </div>
          <div>
            <label className="block font-semibold">Location</label>
            <input className="w-full p-2 rounded-lg border" placeholder="Philadelphia" />
          </div>
          <div>
            <label className="block font-semibold">Skill Level</label>
            <select className="w-full p-2 rounded-lg border">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button className="mt-4 px-6 py-2 border-2 border-black rounded-xl bg-[#f2e28d] hover:scale-105 transition-transform">
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default Profile;