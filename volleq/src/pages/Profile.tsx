import { useState, useRef, JSX } from "react";
import Navbar from "../components/Navbar";
import { useUserStore } from "../store/user.ts";

// --- TYPES ---
interface Badge {
  id: number;
  name: string;
  icon: string;
  description: string;
  receivedDate: string;
}

const BADGES: Badge[] = [
  { id: 1, name: "Philly Local", icon: "🔔", description: "Played 5+ games in the Philadelphia area.", receivedDate: "Oct 12, 2025" },
  { id: 2, name: "Win Streak", icon: "🔥", description: "Won 3 consecutive matches in a single day.", receivedDate: "Jan 05, 2026" },
  { id: 3, name: "Road Warrior", icon: "🚗", description: "Participated in tournaments across 3 different cities.", receivedDate: "Feb 14, 2026" },
  { id: 4, name: "OG Player", icon: "🛡️", description: "Member of the community since the 2024 launch.", receivedDate: "Aug 20, 2024" },
];

function Profile(): JSX.Element {
  const currentUser = useUserStore((state) => state.user);
  
  // --- STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  const [name, setName] = useState(currentUser?.name || "Christine Smith");
  const [location, setLocation] = useState("Philadelphia, PA");
  const [profilePic, setProfilePic] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`);
  const [bannerPic, setBannerPic] = useState(""); 
  
  const [privacy, setPrivacy] = useState({
    showLocation: true,
    showStats: true,
    showBadges: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- IMAGE HELPERS ---
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      type === 'profile' ? setProfilePic(url) : setBannerPic(url);
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

          <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="text-left">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter">{name}</h1>
              <p className="text-lg font-bold text-gray-700">
                {privacy.showLocation ? `📍 ${location}` : "📍 Location Hidden"}
              </p>
            </div>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2 border-4 border-black bg-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 transition-all active:translate-y-1 active:shadow-none"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* --- STATS & BADGES --- */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {privacy.showStats && (
            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="bg-black text-white p-6 rounded-2xl border-2 border-white/20 text-left">
                <p className="text-xs font-bold uppercase opacity-60">Matches Played</p>
                <p className="text-4xl font-black italic">42</p>
              </div>
              <div className="bg-orange-500 text-white p-6 rounded-2xl border-4 border-black text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-bold uppercase">Win Rate</p>
                <p className="text-4xl font-black italic">68%</p>
              </div>
            </div>
          )}

          {privacy.showBadges && (
            <div className="md:col-span-2 bg-[#f5e7b2] p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase mb-6 italic text-left">My Achievements</h3>
              <div className="flex flex-wrap gap-6">
                {BADGES.map((badge) => (
                  <button 
                    key={badge.id} 
                    onClick={() => setSelectedBadge(badge)}
                    className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-transform active:translate-y-1 active:shadow-none"
                  >
                    {badge.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- BADGE DETAIL MODAL --- */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-[32px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-sm w-full text-center relative animate-in zoom-in duration-200">
            <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-6 text-2xl font-black">×</button>
            <div className="w-24 h-24 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {selectedBadge.icon}
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-1">{selectedBadge.name}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Earned {selectedBadge.receivedDate}</p>
            <p className="font-bold text-gray-700 leading-tight mb-6">{selectedBadge.description}</p>
            <button onClick={() => setSelectedBadge(null)} className="w-full py-3 bg-black text-white font-black uppercase rounded-xl">Awesome!</button>
          </div>
        </div>
      )}

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
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-3 border-2 border-black rounded-xl font-bold bg-gray-100">Change Photo</button>
                <button onClick={() => bannerInputRef.current?.click()} className="flex-1 p-3 border-2 border-black rounded-xl font-bold bg-gray-100">Change Banner</button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImage(e, 'profile')} />
                <input type="file" ref={bannerInputRef} className="hidden" onChange={(e) => handleImage(e, 'banner')} />
              </div>

              <div className="text-left space-y-4">
                <div>
                  <label className="block font-black uppercase text-xs mb-1">Display Name</label>
                  <input className="w-full p-3 border-2 border-black rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-black uppercase text-xs mb-1">Location</label>
                  <input className="w-full p-3 border-2 border-black rounded-xl" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-black text-left">
                <h4 className="font-black uppercase text-sm mb-4">Privacy & Visibility</h4>
                {Object.entries(privacy).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2">
                    <span className="font-bold text-sm uppercase">{key.replace('show', 'Show ')}</span>
                    <button 
                      onClick={() => setPrivacy(prev => ({ ...prev, [key]: !val }))}
                      className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${val ? 'bg-green-400' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${val ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-full py-4 bg-yellow-400 border-4 border-black font-black uppercase text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;