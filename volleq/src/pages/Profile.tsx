// src/pages/Profile.tsx
import type { JSX } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doSignOut, doUpdateEmail } from "../firebase/auth.ts";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../api/api.ts";
import { useState } from "react";
import { useUserStore } from "../store/user.ts";
import { useLoadUser } from "../hooks/useLoadUser.tsx";
import { reauthenticateUser } from "../firebase/auth.ts";

function Profile(): JSX.Element {
  // const { currentUser } = useAuth();
  const { loadUser } = useLoadUser();
  const currentUser = useUserStore((state) => state.user)
  const navigate = useNavigate();
  const initialEmail = currentUser?.email || "christine@email.com"
  const [name, setName] = useState(currentUser?.name || "Christine Smith");
  const [email, setEmail] = useState(currentUser?.email || "christine@email.com");
  const [skillLevel, setSkillLevel] = useState("");
  // const handleLogout = async () => {
  //   await doSignOut();
  //   navigate("/");
  // };
  // modial state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");


  const updateProfile = async () => {
    const settings = {
      name: name,
      email: email 
    }
    console.log(`${settings.email} vs ${initialEmail}`)
    if(settings.email !== initialEmail){
      setPendingEmail(email); // store new email temporarily
      setShowPasswordModal(true);
      // change email on the auth side of things
      // doUpdateEmail(settings.email);
      return; // stop here until modal confirms
    }

    console.log(`current settings are: ${JSON.stringify(settings, null, 2)}`)
    await updateUser(settings);
    await loadUser(); // refreshes the userstate from db. 
    navigate("/home");
  }

  const handlePasswordSubmit = async () => {
    try {
      // Reauthenticate first
      await reauthenticateUser(password);

      // Now update email in Firebase
      await doUpdateEmail(pendingEmail.trim());

      // Update DB as well
      await updateUser({ email: pendingEmail });

      await loadUser();
      setShowPasswordModal(false);
      setPassword("");
      navigate("/home");
    } catch (err: any) {
      console.error(err.message);
      alert("Incorrect password, please try again.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl mb-8">Edit Profile</h1>
        <div className="w-96 bg-[#f5e7b2] p-8 rounded-xl shadow-md flex flex-col gap-4">
          <div>
            <label className="block font-semibold">Full Name</label>
            <input className="w-full p-2 rounded-lg border" 
            value={name}
            placeholder={name} 
            onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Email</label>
            <input className="w-full p-2 rounded-lg border" 
            type="text"
            value={email}
            placeholder={email} 
            onChange={(e) => setEmail(e.target.value)} // if we change email, we would have to change email in auth.
            />
          </div>
          <div>
            <label className="block font-semibold">Location</label>
            <input 
            value={"Philadelphia"} // remove this if text input not working.
            className="w-full p-2 rounded-lg border" 
            placeholder="Philadelphia" />
          </div>
          <div>
            <label 

            className="block font-semibold">
              Skill Level</label>
            <select className="w-full p-2 rounded-lg border">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button 
          onClick={updateProfile}
          className="mt-4 px-6 py-2 border-2 border-black rounded-xl bg-[#f2e28d] hover:scale-105 transition-transform">
            Save Changes
          </button>
        </div>
          {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-80 flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Confirm Password</h2>
              <p>Please enter your current password to change your email.</p>
              <input
                type="password"
                className="border p-2 rounded-lg w-full"
                placeholder="Current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 border rounded bg-gray-300 hover:bg-gray-400"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 border rounded bg-yellow-300 hover:bg-yellow-400"
                  onClick={handlePasswordSubmit}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Profile;