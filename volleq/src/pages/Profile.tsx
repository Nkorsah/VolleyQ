import { useState, useRef, JSX, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useUserStore, useUserSync } from "../store/user";
import { doUpdateEmail, reauthenticateUser } from "../firebase/auth";
import { updateUser as updateApiUser } from "../api/api"; // Aliased to avoid collision with store action
import { useNavigate } from "react-router-dom";
import { useLoadUser } from "../hooks/useLoadUser";

function Profile(): JSX.Element {
  // Real-time synchronization for the user state
  useUserSync(); 

  const currentUser = useUserStore((state) => state.user);
  const updateStoreUser = useUserStore((state) => state.updateUser); // Access store action
  const { loadUser } = useLoadUser();
  const navigate = useNavigate();

  // --- STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState(currentUser?.name || "Christine Smith");
  const [location, setLocation] = useState("Philadelphia, PA");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [profilePic, setProfilePic] = useState(currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`);
  const [bannerPic, setBannerPic] = useState("");

  const [privacy, setPrivacy] = useState({
    showLocation: true,
    showStats: true,
    showSkill: true,
  });

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [email, setEmail] = useState(currentUser?.email || "christine@email.com");
  const [winrate, setWinrate] = useState(0);
  const [games_played, setGames_played] = useState(0);

  // Sync state with store on load or when store changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setProfilePic(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Statistics calculation with safety check to prevent crashes
  useEffect(() => {
    if (currentUser?.stats && currentUser.stats.games_played > 0) {
      const calculatedWinrate = (currentUser.stats.wins / currentUser.stats.games_played) * 100;
      setWinrate(Number(calculatedWinrate.toFixed(1)));
      setGames_played(currentUser.stats.games_played);
    } else {
      setWinrate(0);
      setGames_played(currentUser?.stats?.games_played || 0);
    }
  }, [currentUser]);

  const initialEmail = currentUser?.email || "christine@email.com";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePic(url);
    }
  };

  const getSkillColor = (level: string) => {
    if (level === 'Beginner') return 'bg-green-400';
    if (level === 'Intermediate') return 'bg-yellow-400';
    return 'bg-red-500 text-white';
  };

  // --- CORE LOGIC ---
  const updateProfile = async () => {
    // Include profilePic (avatarUrl) to ensure the handshake updates all parts of the UI
    const settings = { 
      name, 
      email, 
      avatarUrl: profilePic 
    };

    if (settings.email !== initialEmail) {
      setPendingEmail(email);
      setShowPasswordModal(true);
      return; 
    }

    try {
      // 1. Update backend DB
      await updateApiUser(settings);
      
      // 2. Update global Zustand store (triggers Navbar update immediately)
      updateStoreUser({
        name: settings.name,
        email: settings.email,
        avatarUrl: settings.avatarUrl
      });

      setIsEditModalOpen(false);
      navigate("/home");
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      await reauthenticateUser(password);
      await doUpdateEmail(pendingEmail.trim());
      
      const updateData = { email: pendingEmail, avatarUrl: profilePic, name };
      await updateApiUser(updateData);

      // Sync with global store
      updateStoreUser(updateData);

      await loadUser();
      setShowPasswordModal(false);
      setPassword("");
      setIsEditModalOpen(false);
      navigate("/home");
    } catch (err: any) {
      console.error(err.message);
      alert("Incorrect password, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6d6a6] pb-12">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto mt-8 px-4">
        {/* --- MAIN PROFILE CARD --- */}
        <div className="relative bg-[#f5e7b2] rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
          <div 
            className="h-32 bg-gradient-to-r from-orange-400 to-yellow-500 border-b-4 border-black"
            style={bannerPic ? { backgroundImage: `url(${bannerPic})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          
          <div className="absolute top-16 left-8">
            <div className="w-32 h-32 rounded-2xl border-4 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row justify-between items-end gap-6 text-left">
            <div className="flex-1 space-y-2">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                {currentUser?.name || "Christine Smith"}
              </h1>
              
              <div className="flex flex-col gap-2">
                <p className="text-lg font-bold text-gray-700">
                  {privacy.showLocation ? `📍 ${location}` : "📍 Location Hidden"}
                </p>
                
                {privacy.showSkill && (
                  <div className="flex">
                    <span className={`px-3 py-1 border-2 border-black rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getSkillColor(skillLevel)}`}>
                      Skill: {skillLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2 border-4 border-black bg-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 transition-all active:translate-y-1 active:shadow-none"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        {privacy.showStats && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-black text-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-bold uppercase opacity-60 mb-2 text-white/60">Matches Played</p>
              <p className="text-6xl font-black italic">{games_played}</p>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-bold uppercase mb-2">Win Rate</p>
              <p className="text-6xl font-black italic">{winrate}%</p>
            </div>
          </div>
        )}
      </main>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase italic">Edit Player Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-3xl font-black">×</button>
            </div>

            <div className="grid gap-6">
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-3 border-2 border-black rounded-xl font-bold bg-gray-100 uppercase text-xs">Change Photo</button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImage} />
              </div>

              <div className="text-left space-y-4">
                <div>
                  <label className="block font-black uppercase text-xs mb-1">Display Name</label>
                  <input className="w-full p-3 border-2 border-black rounded-xl font-bold" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-black uppercase text-xs mb-2">Skill Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSkillLevel(level)}
                        className={`p-3 border-2 border-black rounded-xl font-black uppercase text-[10px] transition-all ${
                          skillLevel === level 
                          ? 'bg-black text-white shadow-none' 
                          : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-black uppercase text-xs mb-1">Location</label>
                  <input className="w-full p-3 border-2 border-black rounded-xl font-bold" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="block font-black uppercase text-xs mb-1">Email</label>
                  <input className="w-full p-3 border-2 border-black rounded-xl font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-2xl border-2 border-black text-left">
                <h4 className="font-black uppercase text-sm mb-4">Privacy & Visibility</h4>
                <div className="space-y-3">
                  {['showLocation','showSkill','showStats'].map(key => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase">{key.replace('show','Show ')}</span>
                      <button
                        onClick={() => setPrivacy(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${privacy[key as keyof typeof privacy] ? 'bg-green-400' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${privacy[key as keyof typeof privacy] ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={updateProfile}
                className="w-full py-4 bg-yellow-400 border-4 border-black font-black uppercase text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mt-4"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80 flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-left">Confirm Password</h2>
            <p className="text-sm text-left">Please enter your current password to change your email.</p>
            <input
              type="password"
              className="border-2 border-black p-2 rounded-lg w-full"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border-2 border-black rounded font-bold bg-gray-300 hover:bg-gray-400"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border-2 border-black rounded font-bold bg-yellow-300 hover:bg-yellow-400"
                onClick={handlePasswordSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;