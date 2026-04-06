import React from "react";
// import type { AppUser } from "../../../server/AppUser";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import { doSignOut } from "../firebase/auth";


const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      await doSignOut(); // sign out from Firebase
      clearUser();       // wipe the Zustand store
      navigate("/");     // redirect to login/landing
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex justify-between items-center px-10 py-5 bg-[#e6d6a6] shadow-sm border-b border-black/10">
      <div 
        className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity" 
        onClick={() => navigate("/home")}
      >
        VolleyQ
      </div>

      <div className="flex items-center gap-8">
        <nav className="flex items-center gap-6">
          <button
            onClick={() => navigate("/home")}
            className="font-semibold hover:text-blue-600 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="font-semibold hover:text-blue-600 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="font-semibold hover:text-blue-600 transition-colors"
          >
            Settings
          </button>
        </nav>

        {/* 3. Conditional Rendering: Only show Logout if a user is logged in */}
        {user && (
          <button
            className="border-2 border-black px-4 py-2 rounded-xl font-bold bg-white/20 hover:bg-black hover:text-white transition-all active:scale-95"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}

        <div className="flex items-center gap-3">
          {user && <span className="font-medium text-sm hidden md:block">{user.name}</span>}
          <img
            className="w-10 h-10 rounded-full border-2 border-black object-cover cursor-pointer hover:scale-110 transition-transform"
            src={user?.avatarUrl || "https://i.pravatar.cc/40?img=62"}
            alt={user?.name || "avatar"}
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;