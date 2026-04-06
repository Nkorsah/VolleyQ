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

  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { setTeam, addMember } = useTeamStore();

  // join team logic
  const handleJoinTeam = async (teamId: string, teamName: string) => {
    // edge case: check if user is already in a team
    if (user?.teamId) {
      alert("Leave your current team first");
      return;
    }

    setIsLoading(true);
    try {
      // call firestore to update
      console.log(`Joining team: ${teamId}`);

      //frontend sync w/ zustand
      updateUser({ teamId: teamId });
      setTeam(teamName);
      addMember(user?.uid || "guest");

      setView("lobby");
     } catch (error) {
      console.error("Join failed:", error);
     } finally {
      setIsLoading(false);
     }
    }

  // --- SUB-VIEW: 1. CHOICE (Create vs Join) ---
  if (view === "choice") {
    return (
      <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full max-w-4xl mx-auto">
        <button onClick={onBack} className="self-start mb-8 text-sm font-bold text-gray-600 hover:underline">← Back to Menu</button>
        <div className="flex flex-wrap justify-center gap-12 mt-4">
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

  // --- SUB-VIEW: 2. TEAM SETTINGS (Create) ---
  if (view === "create_settings") {
    return (
      <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full max-w-xl mx-auto">
        <div className="w-full bg-[#fdf2d1] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-bold mb-6 uppercase">Team Settings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold">Number of players</span>
              <span className="font-bold">{'< 8 >'}</span>
            </div>
            <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-3">
              <span className="font-bold">Team Name</span>
              <input type="text" placeholder="Team B" className="bg-transparent text-right outline-none font-bold border-b border-black w-24" />
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={() => setView("choice")} className="flex-1 py-2 bg-white border-2 border-black font-bold rounded-full text-black">CANCEL</button>
            <button onClick={() => setView("lobby")} className="flex-1 py-2 bg-[#f7e49a] border-2 border-black font-bold rounded-full text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">CREATE TEAM</button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW: 3. OPEN TEAMS (Join) ---
  if (view === "join_list") {
    return (
        <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full max-w-2xl mx-auto relative">
             <div className="w-full text-black">
                <h2 className="text-2xl font-bold mb-4 italic underline underline-offset-4">OPEN TEAMS</h2>
                <div className="space-y-4">
                    {[
                      { id: "team_a_123", name: "TEAM A" },
                      { id: "tigers_456", name: "Tigers" }
                    ].map((team) => (
                        <div key={team.id} className="flex items-center justify-between bg-orange-300 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div>
                                <p className="font-bold text-lg">{team.name}</p>
                                <p className="text-xs font-bold">1/8 Players</p>
                            </div>
                            <button 
                              disabled={isLoading}
                              onClick={() => handleJoinTeam(team.id, team.name)} 
                              className="bg-white border-2 border-black px-8 py-1 font-bold hover:bg-gray-100 uppercase text-black disabled:opacity-50"
                            >
                              {isLoading ? "Joining..." : "Join"}
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setView("choice")} className="mt-8 font-bold underline">Go Back</button>
             </div>
        </div>
    );
  }

  // --- SUB-VIEW: 4. LOBBY ---
  return (
    <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full max-w-5xl mx-auto">
      <div className="w-full bg-[#60a5fa] border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black">
        <h2 className="text-3xl font-black mb-12 uppercase italic">Team Lobby</h2>
        <div className="grid grid-cols-3 gap-y-12 mb-20">
          {/* Active Members Slot */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-black bg-yellow-200 mb-2 overflow-hidden shadow-md">
              <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=you`} alt="you" />
            </div>
            <span className="bg-black text-white px-4 py-0.5 text-xs font-bold uppercase">You</span>
          </div>
          
          <div className="flex flex-col items-center">
             <div className="w-24 h-24 rounded-full border-4 border-dashed border-black bg-gray-100/50 mb-2"></div>
             <span className="text-xs font-bold text-gray-600">Empty Slot</span>
          </div>
        </div>
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2">
             <button onClick={onBack} className="bg-[#f7e49a] border-2 border-black px-12 py-3 font-bold text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase text-black">
                Ready to Play
             </button>
        </div>
      </div>
    </div>
  );
}