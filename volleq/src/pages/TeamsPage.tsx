import { useState, useEffect, JSX } from "react";
import { useUserStore } from "../store/user.ts";
import { useTeamStore } from "../store/team.ts";
import { db } from "../firebase/firebase-service";
import { collection, onSnapshot, query } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Team } from "../types/types";

interface TeamsPageProps {
  onBack: () => void;
  onViewWaitlist: () => void;
}

type TeamsView = "choice" | "create_settings" | "join_list" | "lobby";

const MAX_PLAYERS = 6;

export default function TeamsPage({ onBack, onViewWaitlist }: TeamsPageProps): JSX.Element {
  const [view, setView] = useState<TeamsView>("choice");
  const [openTeams, setOpenTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- CREATE TEAM STATE ---
  const [newTeamName, setNewTeamName] = useState("Team B");

  // Zustand Store Integration
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { currentTeam, resetTeam, subscribeToTeam } = useTeamStore();

  const auth = getAuth();
  // Using ownerId to match the Team type in types.d.ts
  const isHost = currentTeam?.ownerId === user?.userID;

  // --- LIVE LISTENER: Watch for ALL teams online (Real-time List) ---
  useEffect(() => {
    const q = query(collection(db, "teams"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // we use a constant MAX_PLAYERS
      setOpenTeams(teamsData.filter((t: any) => {
        // Using memberIds from the Team type
        const currentCount = Array.isArray(t.memberIds) ? t.memberIds.length : 0;
        return currentCount < MAX_PLAYERS;
      }));
    });

    return () => unsubscribe();
  }, []);

  // --- LOBBY SYNC: ensure Lobby view stays updated via Snapshot ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user?.teamID && view !== "lobby") {
      setView("lobby");
    }

    if (view === "lobby" && user?.teamID) {
      unsubscribe = subscribeToTeam(user.teamID);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [view, user?.teamID, subscribeToTeam]);

  // Helper for API headers
  const getHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // --- ACTIONS (Backend API Calls) ---

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    setIsLoading(true);

    try {
      const headers = await getHeaders();
      const response = await fetch('/api/create-team', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          team_name: newTeamName,
          team_settings: {
            number_of_players: MAX_PLAYERS,
            private: false
          }
        })
      });

      if (!response.ok) throw new Error("API Creation failed");

      const teamData = await response.json();
      
      // update local state - Snapshot listener will handle the rest
      updateUser({ teamID: teamData.teamID });
      setView("lobby");
    } catch (err) {
      console.error("Create Error:", err);
      alert("Error creating team via server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`/api/join-team/${teamId}`, {
        method: 'PUT',
        headers: headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to join");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user?.teamID) return;
    setIsLoading(true);
    
    try {
      const headers = await getHeaders();
      await fetch(`/api/leave-team/${user.teamID}`, {
        method: 'DELETE',
        headers: headers
      });

      updateUser({ teamID: undefined });
      resetTeam();
      setView("choice");
    } catch (err) {
      console.error("Leave Error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  if (view === "choice") {
    return (
      <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-4xl mx-auto relative text-black">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Exit</button>
        <div className="flex flex-wrap justify-center gap-12 mt-4">
          <div onClick={() => setView("create_settings")} className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-9xl font-light mb-4">+</span>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">Create<br/>Team</span>
          </div>
          <div onClick={() => setView("join_list")} className="w-72 h-96 bg-[#60a5fa] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="text-8xl mb-6">👥</div>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">Join<br/>Team</span>
            {openTeams.length > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 border-2 border-black animate-bounce">
                {openTeams.length} LIVE
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. JOIN LIST VIEW (Live Database Data) ---
  if (view === "join_list") {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-2xl mx-auto relative text-black">
        <button onClick={() => setView("choice")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">← Back</button>
        <h2 className="text-2xl font-black uppercase italic mb-8 mt-4 tracking-tighter text-gray-800">Available Teams</h2>
        
        <div className="w-full space-y-4">
          {openTeams.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-black/20 rounded-xl">
              <p className="italic opacity-50">No teams active. Start your own!</p>
            </div>
          ) : (
            openTeams.map((team) => (
              <div key={team.id} className="bg-white border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <p className="font-black text-lg uppercase tracking-tight">{team.name}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {(team.memberIds?.length || 0)} / {MAX_PLAYERS} PLAYERS
                  </p>
                  <div className="flex mt-2 -space-x-2">
                    {/* Accessing rich member objects provided by backend via any cast */}
                    {(team.members as any[])?.slice(0, 3).map((m: any, idx: number) => (
                      <img key={idx} src={m.avatarUrl} className="w-6 h-6 rounded-full border border-black bg-white" alt="avatar" />
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinTeam(team.id)}
                  disabled={isLoading}
                  className="bg-[#f7e49a] border-2 border-black px-6 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            ))
          )}
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
              <span className="font-black text-lg w-4 text-center">{MAX_PLAYERS}</span>
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
        <button onClick={handleCreateTeam} disabled={isLoading} className="w-full mt-8 py-4 bg-[#f7e49a] border-2 border-black font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">
          {isLoading ? "LAUNCHING..." : "CREATE TEAM"}
        </button>
      </div>
    );
  }

  // --- 4. LOBBY VIEW (Dynamic Reflection) ---
  return (
    <div className="w-full bg-[#60a5fa] border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative mt-12 text-black max-w-4xl mx-auto">
      <button 
        onClick={handleLeaveTeam} 
        className="absolute top-4 left-4 text-sm font-bold text-blue-900 hover:underline"
      >
        ← Leave Team
      </button>

      <div className="flex justify-between items-start mb-12 mt-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">{currentTeam?.name || "Lobby"}</h2>
          <p className="text-xs font-bold text-blue-900 uppercase">ID: {user?.teamID}</p>
        </div>
        <span className="bg-white border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            LIVE LOBBY
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-12 mb-20">
        {/* Using any cast for rich members object array returned by backend */}
        {((currentTeam as any)?.members || []).map((m: any) => (
          <div key={m.userID} className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-black bg-yellow-200 mb-2 overflow-hidden shadow-md">
              <img src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userID}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <span className="bg-black text-white px-4 py-0.5 text-xs font-bold uppercase truncate max-w-[100px]">
              {m.userID === user?.userID ? "YOU" : m.name}
            </span>
            {m.team_leader && <span className="text-[10px] font-black text-blue-900 mt-1 uppercase">Captain 👑</span>}
          </div>
        ))}

        {/* Dynamic Empty Slots based on memberIds length */}
        {Array.from({ length: MAX_PLAYERS - (currentTeam?.memberIds?.length || 0) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center">
             <div className="w-24 h-24 rounded-full border-4 border-dashed border-black bg-gray-100/30 mb-2 flex items-center justify-center">
               <span className="text-black/10 text-4xl font-black">+</span>
             </div>
             <span className="text-xs font-bold text-blue-900/30 uppercase tracking-widest">Waiting</span>
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