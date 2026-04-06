// src/pages/Settings.tsx
import type { JSX } from "react";
import Navbar from "../components/Navbar";
// import { useAuth } from "../contexts/authContext/index.tsx";
import { doDeleteUserAuth, doSignOut } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useTeamStore } from "../store/team";
import { deleteUserDataDB } from "../api/api.ts";
// import { useTeamStore } from "../stores/useTeamStore";

function Settings(): JSX.Element {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const resetTeam = useTeamStore((state) => state.resetTeam);

  const handleLogout = async () => {
    try {
      await doSignOut();
      clearUser();  // Wipe user from Zustand
      resetTeam();  // Wipe team from Zustand
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const deleteUser = async () => {
    try {
      // 1. Delete DB data (needs valid token)
      try{
        await deleteUserDataDB();
      } catch (error){
        console.error("delete from DB failed:", error);
      }
      
      
      // 2. Delete Firebase Auth user
       await doDeleteUserAuth();

      // 3. Clear frontend state + redirect
      // await handleLogout();
      clearUser();  // Wipe user from Zustand
      resetTeam();  // Wipe team from Zustand
      navigate("/");
    } catch (error) {
      console.error("delete failed:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      {/* Navbar now manages its own state and logout logic */}
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl mb-8 font-bold">Settings</h1>
        
        <div className="w-full max-w-md bg-[#f5e7b2] p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 text-left">
          
          <section>
            <h2 className="font-bold text-xl mb-3 border-b border-black/10 pb-1">Account</h2>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Change Password</span>
              <button className="border-2 border-black px-3 py-1 rounded-lg bg-white/50 hover:bg-white transition-colors text-sm font-bold">Edit</button>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Email Preferences</span>
              <button className="border-2 border-black px-3 py-1 rounded-lg bg-white/50 hover:bg-white transition-colors text-sm font-bold">Edit</button>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3 border-b border-black/10 pb-1">Notifications</h2>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Game Invites</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-black border-2 border-black" />
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Nearby Games</span>
              <input type="checkbox" className="w-5 h-5 accent-black border-2 border-black" />
            </div>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3 border-b border-black/10 pb-1">Privacy</h2>
            <div className="flex justify-between items-center">
              <span className="font-medium">Public Profile</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-black border-2 border-black" />
            </div>
          </section>

          <section className="pt-4 mt-2 border-t-2 border-black/10">
            <h2 className="font-bold text-xl mb-3 text-red-700">Danger Zone</h2>
            <button 
              className="w-full mt-2 px-4 py-3 border-2 border-black rounded-2xl bg-[#f2e28d] font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
              onClick={handleLogout}
            >
              Log Out
            </button>
            <button 
            onClick={deleteUser}
            className="w-full mt-3 px-4 py-3 border-2 border-black rounded-2xl bg-red-400 font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Delete Account
            </button>
          </section>
          
        </div>
      </main>
    </div>
  );
}

export default Settings;