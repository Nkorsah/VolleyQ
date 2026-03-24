import React from "react";
import type { AppUser } from "../types/AppUser";

type NavbarProps = {
  user?: AppUser | null;
  onLogout?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="flex justify-between items-center px-10 py-5 bg-[#e6d6a6] shadow-sm">
      <div className="text-2xl font-bold">Logo</div>

      <div className="flex items-center gap-8">
        <a href="#" className="font-semibold hover:text-blue-600">
          Home
        </a>
        <a href="#" className="font-semibold hover:text-blue-600">
          Profile
        </a>
        <a href="#" className="font-semibold hover:text-blue-600">
          Settings
        </a>

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
          src={user?.avatarUrl || "https://i.pravatar.cc/40"}
          alt={user?.name || "avatar"}
        />
      </div>
    </header>
  );
};

export default Navbar;
