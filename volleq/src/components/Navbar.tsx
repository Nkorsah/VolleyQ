import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import type { AppUser } from "../types/AppUser";

type NavbarProps = {
  user?: AppUser | null;
  onLogout?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="flex justify-between items-center px-10 py-5 bg-[#FDF0B4] shadow-sm">
      <div className="text-2xl font-bold text-black">Logo</div>

      <div className="flex items-center gap-8">
        <Link to="/home" className="font-semibold text-black hover:text-blue-600">
          Home
        </Link>
        {/* Updated Profile link to point to Edit Profile */}
        <Link to="/edit-profile" className="font-semibold text-black hover:text-blue-600">
          Profile
        </Link>
        <a href="#" className="font-semibold text-black hover:text-blue-600">
          Settings
        </a>

        {onLogout && (
          <button
            className="border border-black px-4 py-2 rounded-lg hover:bg-black/5 text-black font-bold"
            onClick={onLogout}
          >
            Logout
          </button>
        )}

        {/* Wrap the image in a Link to make it clickable */}
        <Link to="/edit-profile" className="hover:opacity-80 transition-opacity">
          <img
            className="w-10 h-10 rounded-full border border-black/20 object-cover"
            src={user?.avatarUrl || "https://i.pravatar.cc/40"}
            alt={user?.name || "avatar"}
          />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
