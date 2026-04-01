import React from "react";
import type { AppUser } from "../../../server/AppUser";
import { useNavigate } from "react-router-dom";

type NavbarProps = {
  user?: AppUser | null;
  onLogout?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="flex justify-between items-center px-10 py-5 bg-[#e6d6a6] shadow-sm">
      <div className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/home")}>
        Logo
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={() => navigate("/home")}
          className="font-semibold hover:text-blue-600"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="font-semibold hover:text-blue-600"
        >
          Profile
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="font-semibold hover:text-blue-600"
        >
          Settings
        </button>

        {onLogout && (
          <button
            className="border border-black px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={onLogout}
          >
            Logout
          </button>
        )}

        <img
          className="w-9 h-9 rounded-full"
          src={user?.avatarUrl || "https://i.pravatar.cc/40?img=62"}
          alt={user?.name || "avatar"}
        />
      </div>
    </header>
  );
};

export default Navbar;