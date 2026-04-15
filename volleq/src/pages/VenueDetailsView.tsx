import Navbar from "../components/Navbar";
import TeamsPage from "../pages/TeamsPage";
import WaitlistPage from "../pages/WaitlistPage";
import HostCourtPage from "../pages/HostCourtPage";
import { useNavigate, useParams } from "react-router-dom";
import { useState, JSX } from "react";
import { useUserStore } from "../store/user";
import { useTeamStore } from "../store/team";

type SubView = "menu" | "teams" | "waitlist" | "host";

export default function VenueDetailsView(): JSX.Element {
  const [activeSubView, setActiveSubView] = useState<SubView>("menu");
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  const { venue_name } = useParams();
  const navigate = useNavigate();

  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { currentTeam, teamMembers, resetTeam, setTeam, removeMember } = useTeamStore();

  const isInTeam = !!user?.teamID;
  const isHost = currentTeam?.hostID === user?.userID;

  const handleExitTeam = () => {
    resetTeam();
    updateUser({ teamID: null });
    setShowTeamModal(false);
  };

  const handleTransferHost = (newHostID: string) => {
    if (!currentTeam) return;
    setTeam({ ...currentTeam, hostID: newHostID });
  };

  const handleKickPlayer = (playerID: string) => {
    removeMember(playerID);
  };

  return (
    <div className="h-screen flex flex-col bg-[#fdf2d1]">
      <Navbar />
      <main
        className="flex-1 flex flex-col relative bg-cover bg-center overflow-y-auto"
        style={{
          backgroundImage: `linear-gradient(rgba(253, 242, 209, 0.7), rgba(253, 242, 209, 0.7)), url('/gym-bg.jpg')`,
        }}
      >
        {activeSubView === "menu" && (
          <div className="flex flex-col items-center pt-12">
            <button onClick={() => navigate("/map")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
              ← Back to Map
            </button>

            <h1 className="text-4xl font-normal text-gray-800 mb-12">{venue_name}</h1>

            <div className="flex flex-col gap-6 w-full max-w-md px-6 text-black">
              <button onClick={() => setActiveSubView("teams")} className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">
                Teams
              </button>
              <button onClick={() => setActiveSubView("waitlist")} className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">
                Waitlist Queue
              </button>
              <button onClick={() => setActiveSubView("host")} className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]">
                Host Court
              </button>
              {isInTeam && (
                <button onClick={() => setShowTeamModal(true)} className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82] flex items-center justify-center gap-3">
                  My Team
                </button>
              )}
            </div>
          </div>
        )}

        {showTeamModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black w-full max-w-md p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">{currentTeam?.name || "The Squad"}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase">Management</p>
                </div>
                <button onClick={() => setShowTeamModal(false)} className="text-2xl font-black hover:text-red-500">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 border-2 border-black bg-gray-50 rounded-lg">
                <div className="p-2 border-b-2 border-black bg-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Roster ({teamMembers.length} / {currentTeam?.maxPlayers})
                </div>
                {teamMembers.map((mID) => {
                  const isPlayerHost = mID === currentTeam?.hostID;
                  const isMe = mID === user?.userID;

                  return (
                    <div key={mID} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mID}`} 
                            className="w-10 h-10 rounded-full border-2 border-black bg-white" 
                            alt="avatar" 
                          />
                          {isPlayerHost && <span className="absolute -top-2 -right-1 text-lg">👑</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm uppercase">{isMe ? "You" : `User_${mID.slice(-4)}`}</span>
                          {isPlayerHost && <span className="text-[10px] font-bold text-blue-600 uppercase">Host</span>}
                        </div>
                      </div>

                      {isHost && !isMe && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleTransferHost(mID)}
                            className="p-1 hover:bg-blue-100 rounded border border-transparent hover:border-blue-400 text-xs"
                          >
                            👑
                          </button>
                          <button 
                            onClick={() => handleKickPlayer(mID)}
                            className="p-1 hover:bg-red-100 rounded border border-transparent hover:border-red-400 text-xs"
                          >
                            🚫
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={handleExitTeam}
                  className="w-full py-4 bg-red-500 text-white border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  {isHost ? "Delete Team" : "Leave Team"}
                </button>
                <button onClick={() => setShowTeamModal(false)} className="w-full py-2 font-bold text-gray-400 uppercase text-xs hover:text-black transition-colors">
                  Close Manager
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PAGES */}
        {activeSubView === "teams" && (
          <TeamsPage 
            onBack={() => setActiveSubView("menu")} 
            onViewWaitlist={() => setActiveSubView("waitlist")} 
          />
        )}
        {activeSubView === "waitlist" && (
          <WaitlistPage 
            onBack={() => setActiveSubView("menu")} 
            isHost={isHost} 
          />
        )}
        {activeSubView === "host" && <HostCourtPage onBack={() => setActiveSubView("menu")} />}
      </main>
    </div>
  );
}