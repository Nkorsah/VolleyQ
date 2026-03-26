// src/pages/Settings.tsx
import type { JSX } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";

function Settings(): JSX.Element {
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
        <h1 className="text-4xl mb-8">Settings</h1>
        <div className="w-96 bg-[#f5e7b2] p-8 rounded-xl shadow-md flex flex-col gap-4">
          <div>
            <h2 className="font-semibold mb-2">Account</h2>
            <div className="flex justify-between mb-2">
              <span>Change Password</span>
              <button className="border px-2 py-1 rounded">Edit</button>
            </div>
            <div className="flex justify-between mb-2">
              <span>Email Preferences</span>
              <button className="border px-2 py-1 rounded">Edit</button>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Notifications</h2>
            <div className="flex justify-between mb-2">
              <span>Game Invites</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex justify-between mb-2">
              <span>Nearby Games</span>
              <input type="checkbox" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Privacy</h2>
            <div className="flex justify-between mb-2">
              <span>Public Profile</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2 text-red-700">Danger Zone</h2>
            <button className="w-full mt-2 px-4 py-2 border-2 border-black rounded-xl bg-[#f2e28d] hover:scale-105 transition-transform" onClick={handleLogout}>
              Log Out
            </button>
            <button className="w-full mt-2 px-4 py-2 border-2 border-black rounded-xl bg-red-300 hover:scale-105 transition-transform">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;