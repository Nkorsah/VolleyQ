import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/index.tsx";
import { updateUser } from "./api.ts";
import Navbar from "../components/Navbar";
import { doSignOut } from "../firebase/auth.ts";

function EditProfile(): JSX.Element {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsUpdating(true);
      setMessage("");
      // call the API to update firestore via backend
      await updateUser(currentUser.uid, { name, avatarUrl });
      setMessage("Profile updated successfully!");
      setTimeout(() => navigate("/home"), 2000);
    } catch (error) {
      setMessage("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="h-screen bg-[#FDF0B4]" />;

  return (
    <div className="h-screen flex flex-col bg-[#FDF0B4] font-sans">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="flex-1 flex items-center justify-center">
        <div className="bg-[#FFF49C] w-[500px] py-12 px-12 rounded-[40px] border border-black/20 shadow-sm">
          <h2 className="text-4xl font-medium text-black mb-10 text-center">Edit Profile</h2>

          <form onSubmit={onUpdate} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-black">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-black">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg"
              />
            </div>

            {message && (
              <p className={`text-center font-bold ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}

            <div className="flex flex-col gap-4 mt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-[#FFF49C] border-2 border-black py-3 rounded-2xl text-xl font-bold hover:bg-black/5 transition-all"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="text-lg font-bold hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditProfile;