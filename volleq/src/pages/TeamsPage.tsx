import { useState, JSX } from "react";
import { useUserStore } from "../store/user";
import { useTeamStore } from "../store/team";
import { Team } from "../types/types";

interface TeamsPageProps {
  onBack: () => void;
  onViewWaitlist: () => void; // Added back for navigation consistency
}

type TeamsView = "choice" | "create_settings" | "join_list" | "lobby";

export default function TeamsPage({ onBack, onViewWaitlist }: TeamsPageProps): JSX.Element {
  const [view, setView] = useState<TeamsView>("choice");
  const [isLoading, setIsLoading] = useState(false);

  // --- CREATE TEAM STATE ---
  const [newTeamName, setNewTeamName] = useState("Team B");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [teamColor, setTeamColor] = useState("#60a5fa");

  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { currentTeam, setTeam, addMember } = useTeamStore();

  const isHost = currentTeam?.hostID === user?.userID;

  // --- ACTIONS ---
  const handleCreateTeam = () => {
    if (!user) return;
    setIsLoading(true);
    const teamID = `team_${Date.now()}`;
    
    const newTeam: Team = {
      id: teamID,
      name: newTeamName,
      hostID: user.userID,
      color: teamColor,
      maxPlayers: maxPlayers,
      members: [user.userID]
    };

    setTeam(newTeam);
    updateUser({ teamID: teamID });
    addMember(user.userID);
    
    setTimeout(() => {
      setIsLoading(false);
      setView("lobby");
    }, 500);
  };

  const handleJoinTeam = (teamId: string) => {
    if (!user) return;
    setIsLoading(true);
    
    updateUser({ teamID: teamId });
    addMember(user.userID);

    setTimeout(() => {
      setIsLoading(false);
      setView("lobby");
    }, 500);
  };

  // --- 1. CHOICE VIEW ---
  if (view === "choice") {
    return (
      <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-4xl mx-auto relative text-black">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back</button>
        <div className="flex flex-wrap justify-center gap-12 mt-4">
          <div onClick={() => setView("create_settings")} className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-9xl font-light mb-4">+</span>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">Create<br/>Team</span>
          </div>
          <div onClick={() => setView("join_list")} className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-8xl mb-6">👥</div>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">Join<br/>Team</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. JOIN LIST VIEW ---
  if (view === "join_list") {
    const mockTeams = [
      { id: "team_1", name: "BALTIMORE BIRDS", members: 3, max: 5 },
      { id: "team_2", name: "NET RIPPERS", members: 1, max: 4 },
    ];

    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-2xl mx-auto relative text-black">
        <button onClick={() => setView("choice")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back</button>
        <h2 className="text-2xl font-black uppercase italic mb-8 mt-4 tracking-tighter text-gray-800">Available Teams</h2>
        
        <div className="w-full space-y-4">
          {mockTeams.map((team) => (
            <div key={team.id} className="bg-white border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <p className="font-black text-lg uppercase tracking-tight">{team.name}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{team.members}/{team.max} PLAYERS</p>
              </div>
              <button 
                onClick={() => handleJoinTeam(team.id)}
                className="bg-[#f7e49a] border-2 border-black px-6 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. CREATE SETTINGS VIEW ---
  if (view === "create_settings") {
    return (
      <div className="w-full max-w-xl bg-[#fdf2d1] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto mt-16 text-black">
        <button onClick={() => setView("choice")} className="text-xs font-bold uppercase mb-4 block underline text-gray-500 hover:text-black">← Back</button>
        <h2 className="text-xl font-black mb-6 uppercase italic tracking-tighter border-b-2 border-black pb-2">Team Settings</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-4">
            <span className="font-bold uppercase text-xs tracking-widest text-blue-900">Max Players</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setMaxPlayers(Math.max(1, maxPlayers - 1))} className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100">-</button>
              <span className="font-black text-lg w-4 text-center">{maxPlayers}</span>
              <button onClick={() => setMaxPlayers(Math.min(20, maxPlayers + 1))} className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100">+</button>
            </div>
          </div>
          <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-4">
            <span className="font-bold uppercase text-xs tracking-widest text-blue-900">Team Name</span>
            <input 
              type="text" 
              value={newTeamName} 
              onChange={(e) => setNewTeamName(e.target.value)} 
              className="bg-transparent text-right outline-none font-black border-b-2 border-black w-40 uppercase placeholder:text-blue-400" 
              placeholder="ENTER NAME..."
            />
          </div>
        </div>
        <button onClick={handleCreateTeam} className="w-full mt-8 py-4 bg-[#f7e49a] border-2 border-black font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">
          {isLoading ? "CREATING..." : "CREATE TEAM"}
        </button>
      </div>
    );
  }

  // --- 4. LOBBY VIEW ---
  return (
    <div className="w-full bg-[#60a5fa] border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative mt-12 text-black max-w-4xl mx-auto">
      {/* Back Arrow for Lobby */}
      <button 
        onClick={() => setView("choice")} 
        className="absolute top-4 left-4 text-sm font-bold text-blue-900 hover:underline"
      >
        ← Back
      </button>

      <div className="flex justify-between items-start mb-12 mt-4">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">{currentTeam?.name || newTeamName} Lobby</h2>
        <span className="bg-white border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
           LIVE
        </span>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-5 gap-y-12 mb-20">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-black bg-yellow-200 mb-2 overflow-hidden shadow-md">
            <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.userID}`} alt="avatar" />
          </div>
          <span className="bg-black text-white px-4 py-0.5 text-xs font-bold uppercase truncate max-w-[100px]">{user?.name}</span>
          {isHost && <span className="text-[10px] font-black text-blue-900 mt-1 uppercase">Host 👑</span>}
        </div>

        {Array.from({ length: (currentTeam?.maxPlayers || maxPlayers) - 1 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
             <div className="w-24 h-24 rounded-full border-4 border-dashed border-black bg-gray-100/30 mb-2 flex items-center justify-center">
               <span className="text-black/10 text-4xl font-black">+</span>
             </div>
             <span className="text-xs font-bold text-blue-900/30 uppercase tracking-widest">Open</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2">
         <button 
           onClick={onViewWaitlist}
           className="bg-[#f7e49a] border-2 border-black px-12 py-3 font-black text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all uppercase"
         >
            {isHost ? "Select Court" : "View Waitlist"}
         </button>
      </div>
    </div>
  );
}