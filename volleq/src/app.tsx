import type { JSX } from "react";
import Navbar from "./components/Navbar";
import { useAuth } from './contexts/authContext/index.tsx';
import {doSignOut} from './firebase/auth.ts'
import { useNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MapPage from "./pages/MapPage";
// import Home from "./pages/home";
import EditProfile from "./pages/EditProfile";

function App(): JSX.Element {
  const { currentUser, userLoggedIn, loading} = useAuth();

   const navigate = useNavigate();
  const handleLogout = async () => {
  try {
    await doSignOut(); // wait for sign out to complete
    console.log("User logged out successfully");
    navigate("/"); // now safe to redirect
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar user={currentUser} onLogout={handleLogout} />
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <Routes>
        {/* Home Page Content */}
        <Route path="/home" element={
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <h1 className="text-5xl mb-10">Welcome back {currentUser?.name || "Player"}!</h1>
            <button className="text-2xl px-12 py-5 rounded-2xl border-2 border-black bg-[#f2e28d] hover:scale-105 transition-transform">
              Find a Game
            </button>
          </div>
        } />

        {/* Edit Profile Page */}
        <Route path="/edit-profile" element={<EditProfile />} />

        {/* Other Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
      </main>
    </div>
  );
}

export default App;