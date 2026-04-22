import { useState, useEffect, JSX } from "react";
import { useUserStore } from "../store/user.ts";
import { useTeamStore } from "../store/team.ts";
import { db } from "../firebase/firebase-service";
import { collection, onSnapshot, query,   where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { createTeam, createTeam as createTeamAPI, joinTeam, leaveTeam } from "../api/api";
import { Team } from "../types/types";
import { useParams } from "react-router-dom";
import { useUserSync } from "../store/user.ts";
import TeamCard from "../components/TeamCard.tsx";

interface TeamsPageProps {
  onBack: () => void;
  onViewWaitlist: () => void;
}

type TeamsView = "choice" | "create_settings" | "join_list" | "lobby";

const MAX_PLAYERS = 6;

export default function TeamsPage({
  onBack,
  onViewWaitlist,
}: TeamsPageProps): JSX.Element {
  useUserSync();



  const { venueID } = useParams();

  const [view, setView] = useState<TeamsView>("choice");
  const [openTeams, setOpenTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- CREATE TEAM STATE ---
  const [newTeamName, setNewTeamName] = useState("Team B");
  const [teamColor, setTeamColor] = useState("#60a5fa"); // default blue
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);

  // Zustand Store Integration
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { currentTeam, resetTeam, subscribeToTeam } = useTeamStore();

  const auth = getAuth();
  // Using ownerId to match the Team type in types.d.ts
  const isHost = currentTeam?.owner_id === user?.userID;

  // live reloading for teams
  useEffect(() => {
    if (!user?.teamID) return;

    subscribeToTeam(user.teamID);

  }, [user?.teamID]);

  // if the user is not on a team, show them the create and join team menu
  useEffect(() => {
    if (!user?.teamID) {
      setView("choice");
    } else {
      setView("lobby");
    }
  }, [user?.teamID]);

  // --- LIVE LISTENER: Watch for ALL teams online (Real-time List) ---
  // query to get all teams in the same venue
  useEffect(() => {
    if (!venueID) return; // guard

    const q = query(
      collection(db, "teams"),
      where("venueID", "==", venueID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOpenTeams(
        teamsData.filter((t: any) => {
          const currentCount = Array.isArray(t.members)
            ? t.members.length
            : 0;
          return currentCount < t.team_settings.number_of_players; // teams that are not full
        })
      );
    });

    return () => unsubscribe();
  }, [venueID]);
  
  
  // --- ACTIONS (Backend API Calls) ---

  const handleCreateTeam = async () => {
  if (!user) return;
  if (!venueID) return;
  setIsLoading(true);

  try {
    await createTeamAPI({ // creates a new team
      team_name: newTeamName,
      team_settings: {
        team_color: teamColor,
        number_of_players: maxPlayers,
        private: isPrivate
      },
      venueID: venueID
    });

    setView("lobby");
  } catch (err) {
    console.error("Create team failed:", err);
  } finally {
    setIsLoading(false);
  }
};

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;

    setIsLoading(true);

    try {
      await joinTeam(teamId);
      setView("lobby");
      // do notification. Team joined! 
    } catch (err: any) {
      alert(err.message || "Failed to join team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user?.teamID) return;
    setIsLoading(true);

    try {
      await leaveTeam(user?.teamID)

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
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Exit
        </button>
        <div className="flex flex-wrap justify-center gap-12 mt-4">
          <div
            onClick={() => setView("create_settings")}
            className="w-72 h-96 bg-[#f59e0b] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="text-9xl font-light mb-4">+</span>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">
              Create
              <br />
              Team
            </span>
          </div>
          <div
            onClick={() => setView("join_list")}
            className="w-72 h-96 bg-[#60a5fa] border-2 border-black flex flex-col items-center justify-center cursor-pointer hover:translate-y-[-4px] transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative"
          >
            <div className="text-8xl mb-6">👥</div>
            <span className="text-2xl font-bold uppercase text-center leading-tight tracking-tighter italic">
              Join
              <br />
              Team
            </span>
            {openTeams.length > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 border-2 border-black animate-bounce">
                {openTeams.length} OPEN TEAMS
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

      <button
        onClick={() => setView("choice")}
        className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-black uppercase italic mb-8 mt-4 tracking-tighter text-gray-800">
        Available Teams
      </h2>

      <div className="w-full max-w-7xl mx-auto space-y-4">
        {openTeams.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-black/20 rounded-xl">
            <p className="italic opacity-50">
              No teams active. Start your own!
            </p>
          </div>
        ) : (
          // component for the team card
          openTeams.map((team) => (
            <TeamCard
              key={team.teamID}
              team={team}
              maxPlayers={team.team_settings.number_of_players}
              onJoin={() => handleJoinTeam(team.teamID)}
              isLoading={isLoading}
            />
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
        <button
          onClick={() => setView("choice")}
          className="text-xs font-bold uppercase mb-4 block underline text-gray-500 hover:text-black"
        >
          ← Back
        </button>
        <h2 className="text-xl font-black mb-6 uppercase italic tracking-tighter border-b-2 border-black pb-2">
          Team Settings
        </h2>
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
            <span className="font-bold uppercase text-xs tracking-widest text-blue-900">
              Team Name
            </span>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-transparent text-right outline-none font-black border-b-2 border-black w-40 uppercase placeholder:text-blue-400"
              placeholder="ENTER NAME..."
            />
          </div>
          <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-4">
            <span className="font-bold uppercase text-xs tracking-widest text-blue-900">
              Team Color
            </span>
            <input
              type="color"
              value={teamColor}
              onChange={(e) => setTeamColor(e.target.value)}
              className="w-10 h-10 border-2 border-black cursor-pointer"
            />
          </div>
          <div className="flex justify-between items-center bg-[#60a5fa] border-2 border-black p-4">
            <span className="font-bold uppercase text-xs tracking-widest text-blue-900">
              Private Team
            </span>

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
        <button
          onClick={handleCreateTeam}
          disabled={isLoading}
          className="w-full mt-8 py-4 bg-[#f7e49a] border-2 border-black font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50"
        >
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
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            {currentTeam?.team_name || "Lobby"}
          </h2>
          <p className="text-xs font-bold text-blue-900 uppercase">
            ID: {currentTeam?.teamID}
          </p>
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
              <img
                src={
                  m.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userID}`
                }
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="bg-black text-white px-4 py-0.5 text-xs font-bold uppercase truncate max-w-[100px]">
              {m.userID === user?.userID ? "YOU" : m.name}
            </span>
            {m.team_leader && (
              <span className="text-[10px] font-black text-blue-900 mt-1 uppercase">
                Captain 👑
              </span>
            )}
          </div>
        ))}

        {/* Dynamic Empty Slots based on member length */}
        {Array.from({
          length: MAX_PLAYERS - (currentTeam?.members?.length || 0),
        }).map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-black bg-gray-100/30 mb-2 flex items-center justify-center">
              <span className="text-black/10 text-4xl font-black">+</span>
            </div>
            <span className="text-xs font-bold text-blue-900/30 uppercase tracking-widest">
              Waiting
            </span>
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
