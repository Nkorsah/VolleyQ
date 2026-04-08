import { useState, JSX } from "react";
import { useUserStore } from "../store/user";
import { useTeamStore } from "../store/team";

interface TeamsPageProps {
  onBack: () => void;
}

type TeamsView = "choice" | "create_settings" | "join_list" | "lobby";

export default function TeamsPage({ onBack }: TeamsPageProps): JSX.Element {
  const [view, setView] = useState<TeamsView>("choice");
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW CUSTOMIZABLE STATE ---
  const [newTeamName, setNewTeamName] = useState("Team B");
  const [maxPlayers, setMaxPlayers] = useState(5);
  // NEW FIELDS
  const [teamColor, setTeamColor] = useState("#60a5fa"); // default blue
  const [isPrivate, setIsPrivate] = useState(false);

  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { setTeam, addMember } = useTeamStore();

  const handleCreateTeam = () => {
    setIsLoading(true);
    // Sync with your store
    setTeam(newTeamName);
    updateUser({ teamID: `team_${Date.now()}` }); // Temporary ID generation
    addMember(user?.userID || "guest");
    
    setTimeout(() => {
      setIsLoading(false);
      setView("lobby");
    }, 500);
  };

  const handleJoinTeam = async (teamId: string, teamName: string) => {
    if (user?.teamID) {
      alert("Leave your current team first");
      return;
    }

    setIsLoading(true);
    try {
      updateUser({ teamID: teamId });
      setTeam(teamName);
      addMember(user?.userID || "guest");
      setView("lobby");
    } catch (error) {
      console.error("Join failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUB-VIEW: 1. CHOICE ---
  if (view === "choice") {
    return (
      <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-4xl mx-auto relative">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back to Menu</button>
        <div className="flex flex-wrap justify-center gap-12 mt-4 text-black">
          <div onClick={() => setView("create_settings")} className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-9xl font-light mb-4">+</span>
            <span className="text-2xl font-bold tracking-tighter text-center px-4 uppercase leading-tight">Create<br/>Team</span>
          </div>
          <div onClick={() => setView("join_list")} className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-8xl mb-6">👥</div>
            <span className="text-2xl font-bold tracking-tighter text-center px-4 uppercase leading-tight">Join<br/>Team</span>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW: 2. TEAM SETTINGS (Customizable) ---
  if (view === "create_settings") {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-xl mx-auto relative">
        <button onClick={() => setView("choice")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back</button>

        <div className="w-full bg-[#fdf2d1] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8 text-black">
          <h2 className="text-xl font-bold mb-6 uppercase">Team Settings</h2>
          
          <div className="space-y-4">
            {/* Player Count Stepper */}
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold uppercase text-sm">Number of players</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMaxPlayers(Math.max(1, maxPlayers - 1))}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5"
                >
                  -
                </button>
                <span className="font-bold text-lg w-4 text-center">{maxPlayers}</span>
                <button 
                  onClick={() => setMaxPlayers(Math.min(20, maxPlayers + 1))}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5"
                >
                  +
                </button>
              </div>
            </div>

            {/* Team Name Input */}
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold uppercase text-sm">Team Name</span>
              <input 
                type="text" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="bg-transparent text-right outline-none font-bold border-b-2 border-black w-32 placeholder:text-blue-800/50" 
              />
            </div>
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold uppercase text-sm">Team Color</span>
              <input
                type="color"
                value={teamColor}
                onChange={(e) => setTeamColor(e.target.value)}
                className="w-10 h-10 border-2 border-black cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold uppercase text-sm">Private Team</span>
              
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 flex items-center border-2 border-black ${
                  isPrivate ? "bg-green-400" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white border border-black transform transition-transform ${
                    isPrivate ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleCreateTeam}
              disabled={isLoading || !newTeamName.trim()}
              className="w-full py-4 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "CREATE TEAM"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW: 3. JOIN LIST & 4. LOBBY (Remains similar but uses maxPlayers) ---
  if (view === "join_list") {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-2xl mx-auto relative text-black">
        <button onClick={() => setView("choice")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back</button>
        <div className="w-full mt-8">
          <h2 className="text-2xl font-bold mb-4 italic underline underline-offset-4 uppercase">Open Teams</h2>
          <div className="space-y-4">
            {[{ id: "team_a_123", name: "TEAM A", count: 1, max: 5 }].map((team) => (
              <div key={team.id} className="flex items-center justify-between bg-orange-300 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <p className="font-bold text-lg uppercase">{team.name}</p>
                  <p className="text-xs font-bold">{team.count}/{team.max} Players</p>
                </div>
                <button onClick={() => handleJoinTeam(team.id, team.name)} className="bg-white border-2 border-black px-8 py-1 font-bold hover:bg-gray-100 uppercase">Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-5xl mx-auto relative text-black">
      <button onClick={() => setView("choice")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Leave Team</button>
      <div className="w-full bg-[#60a5fa] border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative mt-8">
        <h2 className="text-3xl font-black mb-12 uppercase italic">{newTeamName} Lobby</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-y-12 mb-20">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-black bg-yellow-200 mb-2 overflow-hidden shadow-md">
              <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=you`} alt="you" />
            </div>
            <span className="bg-black text-white px-4 py-0.5 text-xs font-bold uppercase truncate max-w-[100px]">{user?.name || "You"}</span>
          </div>
          
          {/* Dynamically render empty slots based on customizable maxPlayers */}
          {Array.from({ length: maxPlayers - 1 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
               <div className="w-24 h-24 rounded-full border-4 border-dashed border-black bg-gray-100/50 mb-2"></div>
               <span className="text-xs font-bold text-blue-900/40 uppercase">Open</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2">
             <button onClick={onBack} className="bg-[#f7e49a] border-2 border-black px-12 py-3 font-bold text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase">
                Ready to Play
             </button>
        </div>
      </div>
    </div>
  );
}