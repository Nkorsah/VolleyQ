import { useState, useEffect, JSX } from "react";
import { useUserSync, useUserStore } from "../store/user";
import { useParams } from "react-router-dom";
import { useTeamStore } from "../store/team";
import { db } from "../firebase/firebase-service";
import { collection, onSnapshot, query, doc, where, getDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase-service";
import {
  joinQueue, leaveQueue, startMatch,
  endMatch, updateScore,
} from "../api/api";
import HostCourtPage from "./HostCourtPage";
import { MatchPredictor } from "../components/MatchPredictor";

interface Props {
  onBack: () => void;
  isHost?: boolean;
  initialWinningScore?: number;
}

type WaitlistView = "court_list" | "scoreboard" | "queue_detail";

export default function WaitlistPage({
  onBack,
  isHost = false,
  initialWinningScore = 21,
}: Props): JSX.Element {
  const { venueID } = useParams();
  useUserSync();

  const user = useUserStore((state) => state.user);
  const { currentTeam } = useTeamStore();

  // ── View state ────────────────────────────────────────
  const [view, setView] = useState<WaitlistView>("court_list");
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [myCurrentCourt, setMyCurrentCourt] = useState<string | null>(null);
  const [showHostOverlay, setShowHostOverlay] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [joiningCourtId, setJoiningCourtId] = useState<string | null>(null);

  // ── Data state ────────────────────────────────────────
  const [courts, setCourts] = useState<any[]>([]);
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [match, setMatch] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Score state ───────────────────────────────────────
  const [winner, setWinner] = useState<string | null>(null);
  const [winningScore] = useState(initialWinningScore);

  // ── Derived ───────────────────────────────────────────
  const selectedCourtObj = courts.find(c => c.courtID === selectedCourt);
  const selectedCourtName = selectedCourtObj?.court_settings?.court_name;
  const scoreLimit = selectedCourtObj?.court_settings?.score_limit ?? winningScore;
  const team1 = match?.team1 ?? null;
  const team2 = match?.team2 ?? null;
  const scoreA = team1?.team_score ?? 0;
  const scoreB = team2?.team_score ?? 0;
  const playingTeams = queueEntries.filter(e => e.status === 'playing');
  const waitingTeams = queueEntries.filter(e => e.status === 'on_deck' || e.status === 'waiting');

  // ── Courts snapshot ───────────────────────────────────
  useEffect(() => {
    if (!venueID) return;

    const q = query(
      collection(db, 'courts'),
      where('venueID', '==', venueID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        courtID: doc.id,
        ...doc.data(),
      }));
      setCourts(data);
    });

    return () => unsubscribe();
  }, [venueID]);

  // ── Match snapshot when court selected ───────────────
  useEffect(() => {
    if (!selectedCourtObj?.matchID) return;

    const unsubscribe = onSnapshot(
      doc(db, 'matches', selectedCourtObj.matchID),
      (snap) => {
        if (snap.exists()) {
          setMatch(snap.data());
          // check score limit
          const data = snap.data();
          const limit = selectedCourtObj?.court_settings?.score_limit ?? winningScore;
          if (data?.team1?.team_score >= limit) setWinner(data.team1.team_name);
          else if (data?.team2?.team_score >= limit) setWinner(data.team2.team_name);
          else setWinner(null);
        }
      }
    );

    return () => unsubscribe();
  }, [selectedCourtObj?.matchID]);

  // ── Queue snapshot when court selected ───────────────
  useEffect(() => {
    if (!selectedCourtObj?.queueID) return;

    const unsubscribe = onSnapshot(
      doc(db, 'queues', selectedCourtObj.queueID),
      async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const team_queue = data?.team_queue ?? [];

        if (team_queue.length === 0) {
        setQueueEntries([]);
        return;
        }

        const teamIDs = team_queue.map((entry: any) =>
        typeof entry === 'string' ? entry : entry.teamID
        );

        const teamSnapshots = await Promise.all(
        teamIDs.map((id: string) => getDoc(doc(db, 'teams', id)))
        );

        teamSnapshots.forEach((d, i) => {
          console.log(`id: ${teamIDs[i]}, exists: ${d.exists()}, team_name: ${d.data()?.team_name}`);
        });

        const nameMap: Record<string, string> = {};
        teamSnapshots.forEach((d, i) => {
        nameMap[teamIDs[i]] = d.exists() ? (d.data()?.team_name ?? teamIDs[i]) : teamIDs[i];
        });


        // hydrate queue entries with status
        const hydrated = team_queue.map((entry: any, index: number) => {
          const teamID = typeof entry === 'string' ? entry : entry.teamID;
          return {
            teamID,
            name: nameMap[teamID] ?? teamID, // will be replaced by team name lookup if needed
            skill_level: entry?.skill_level,
            position: index,
            status: index === 0 ? 'playing' : index === 1 ? 'on_deck' : 'waiting',
          };
        });
        console.log('hydrated entries:', JSON.stringify(hydrated));
        setQueueEntries(hydrated);
      }
    );

    return () => unsubscribe();
  }, [selectedCourtObj?.queueID]);

  // ── Helpers ───────────────────────────────────────────
  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');
    return token;
  };

  const loadCourts = () => {}; // snapshots handle this automatically

  // ── Handlers ──────────────────────────────────────────
  const handleJoinCourt = async (courtID: string, name: string) => {
    setJoiningCourtId(courtID);
    setError(null);
    try {
      const token = await getToken();
      await joinQueue(courtID, token);
      setMyCurrentCourt(courtID);
      setSelectedCourt(courtID);
      setView('scoreboard');
    } catch (err: any) {
      console.error('problem joining court queue', err);
      setError(err.message || 'Failed to join queue');
    } finally {
      setJoiningCourtId(null);
    }
  };

  const handleLeaveCourt = async (courtID: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      await leaveQueue(courtID, token);
      setMyCurrentCourt(null);
    } catch (err: any) {
      setError(err.message || 'Failed to leave queue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!selectedCourtObj?.courtID) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      await startMatch(selectedCourtObj.courtID, token);
    } catch (err: any) {
      setError(err.message || 'Failed to start match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndMatch = async () => {
    if (!selectedCourtObj?.courtID) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      await endMatch(selectedCourtObj.courtID, token);
      setWinner(null);
      setShowPrediction(false);
    } catch (err: any) {
      setError(err.message || 'Failed to end match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateScore = async (teamID: string, points: number) => {
    if (!selectedCourtObj?.courtID || !match || winner) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      await updateScore(selectedCourtObj.courtID, teamID, points, token);
      // score updates via snapshot automatically
    } catch (err: any) {
      setError(err.message || 'Failed to update score');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Court list UI map ─────────────────────────────────
  const courtsUI = courts.map((court) => {
    const ms = court.match_summary;
    const count = court.queue_length || 0;

    let status = 'Waiting for teams...';
    if (ms?.team1_name && ms?.team2_name) {
      status = `${ms.team1_name} vs ${ms.team2_name}`;
    } else if (ms?.team1_name || ms?.team2_name) {
      status = `${ms.team1_name || ms.team2_name} waiting for one team`;
    }

    return {
      id: court.courtID,
      name: court.court_settings?.court_name,
      count,
      status,
      color: ms?.team1_name && ms?.team2_name
        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
        : 'bg-gradient-to-r from-orange-400 to-yellow-400',
    };
  });

  // ── Host overlay ──────────────────────────────────────
  if (showHostOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fdf2d1]">
        <HostCourtPage onBack={() => setShowHostOverlay(false)} />
      </div>
    );
  }

  // ── Court list view ───────────────────────────────────
  if (view === 'court_list') {
    return (
      <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center pt-16 px-4 relative text-black text-center">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Lobby
        </button>

        <div className="w-full max-w-2xl flex flex-col gap-4 relative mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-black uppercase italic">
              {isHost ? 'Court Management' : 'Available Courts'}
            </h2>
            <button
              onClick={() => setShowHostOverlay(true)}
              className="px-4 py-2 bg-black text-white border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 active:translate-y-0.5 transition-all"
            >
              + Host Court
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-sm rounded-lg">
              {error}
            </div>
          )}

          {courts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 mt-8">
              <p className="font-bold text-gray-500 uppercase text-sm">No courts available at this venue</p>
              <button
                onClick={() => setShowHostOverlay(true)}
                className="px-8 py-4 bg-[#f7e49a] border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#f2db82] active:translate-y-1 active:shadow-none transition-all"
              >
                Be the first to host a court!
              </button>
            </div>
          ) : (
            courtsUI.map((court) => {
              const isMyCourt = myCurrentCourt === court.id;
              return (
                <div key={court.id} className="flex flex-col gap-2">
                  <div
                    onClick={() => { setSelectedCourt(court.id); setView('scoreboard'); }}
                    className={`${court.color} border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center transition-all cursor-pointer hover:translate-y-[-2px] relative ${
                      isMyCourt ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#fefce8]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 border-2 border-black bg-orange-200/50 flex flex-col justify-between p-1">
                        <div className="h-1/3 border-b border-black"></div>
                        <div className="h-1/3 border-b border-black"></div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-3xl font-black tracking-tight">{court.name}</span>
                        <span className="text-sm font-bold">{court.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black block leading-none">
                        {court.count + (isMyCourt ? 1 : 0)}
                      </span>
                      <span className="text-[10px] font-bold uppercase leading-none opacity-60">In Queue</span>
                    </div>
                  </div>

                  {user?.teamID && (
                    <div className="flex gap-2 mb-4">
                      {isMyCourt ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeaveCourt(court.id); }}
                          disabled={actionLoading}
                          className="flex-1 bg-red-500 text-white border-2 border-black font-black uppercase text-xs py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 disabled:opacity-50"
                        >
                          Leave Queue
                        </button>
                      ) : (
                        !myCurrentCourt && (
                          <button
                            disabled={joiningCourtId === court.id}
                            onClick={(e) => { e.stopPropagation(); handleJoinCourt(court.id, court.name); }}
                            className={`flex-1 border-2 border-black font-black uppercase text-xs py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all ${
                              joiningCourtId === court.id ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'
                            }`}
                          >
                            {joiningCourtId === court.id ? 'Joining...' : 'Join Queue'}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!isHost && user?.teamID && myCurrentCourt && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border-4 border-black p-4 flex items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50">
            <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center">
              <span className="animate-pulse text-xl">⏳</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black uppercase text-xs tracking-tighter text-gray-400">Status</span>
              <span className="font-black uppercase text-sm leading-tight">You're in the queue!</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Waiting for teams view ────────────────────────────
  if (view === 'scoreboard' && selectedCourtObj?.match_summary?.team2_name == null) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4 relative">
        <button onClick={() => setView('court_list')} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Courts
        </button>

        <div className="opacity-70 mb-10">
          <div className="circle-dots w-40 h-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`dot dot-${i}`} />
            ))}
          </div>
        </div>

        <h1 className="text-7xl font-extrabold mb-6 italic tracking-tighter uppercase">
          Waiting for Teams
        </h1>
        <p className="text-xl font-bold text-gray-800 max-w-md mb-10 leading-snug">
          There needs to be at least two teams before starting a match
        </p>

        {isHost && !myCurrentCourt && (
          <button
            onClick={() => handleJoinCourt(selectedCourtObj?.courtID, selectedCourtName)}
            disabled={!!joiningCourtId}
            className="px-16 py-3 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase disabled:opacity-50"
          >
            {joiningCourtId ? 'Joining...' : 'Join Queue'}
          </button>
        )}
      </div>
    );
  }

  // ── Scoreboard view ───────────────────────────────────
  if (view === 'scoreboard') {
    return (
      <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center justify-center px-4 relative text-black text-center">
        <button onClick={() => setView('court_list')} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Courts
        </button>

        <h2 className="text-3xl font-black italic uppercase mt-8 mb-4 tracking-tighter">
          {selectedCourtName}
        </h2>

        {error && (
          <p className="text-red-600 text-xs font-bold border-2 border-red-400 rounded-xl px-4 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 mb-6 bg-white border-2 border-black px-4 py-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-black uppercase text-gray-400">Match Goal:</span>
          <span className="text-lg font-black text-orange-600">{scoreLimit} PTS</span>
        </div>

        {/* Host start match button */}
        {isHost && !match?.ongoing && queueEntries.length >= 2 && (
          <button
            onClick={handleStartMatch}
            disabled={actionLoading}
            className="mb-4 px-8 py-2 bg-green-400 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 disabled:opacity-50"
          >
            {actionLoading ? 'Starting...' : 'Start Match'}
          </button>
        )}

        <div className="flex w-full max-w-6xl aspect-[16/10] border-4 border-black rounded-[40px] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative bg-black">

          {/* Team A */}
          <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center border-r-4 border-black relative">
            <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreA}</span>
            <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">
              {team1?.team_name ?? 'Team A'}
            </span>

            {isHost && match?.ongoing && team1 && (
              <div className="absolute inset-y-0 left-8 flex flex-col justify-center gap-6 z-[60]">
                <button onClick={() => handleUpdateScore(team1.teamID, 1)} disabled={actionLoading} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">+</button>
                <button onClick={() => handleUpdateScore(team1.teamID, -1)} disabled={actionLoading} className="w-20 h-20 bg-orange-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">-</button>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 bg-blue-500 flex flex-col items-center justify-center relative">
            <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreB}</span>
            <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">
              {team2?.team_name ?? 'Team B'}
            </span>

            {isHost && match?.ongoing && team2 && (
              <div className="absolute inset-y-0 right-8 flex flex-col justify-center gap-6 z-[60]">
                <button onClick={() => handleUpdateScore(team2.teamID, 1)} disabled={actionLoading} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">+</button>
                <button onClick={() => handleUpdateScore(team2.teamID, -1)} disabled={actionLoading} className="w-20 h-20 bg-blue-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">-</button>
              </div>
            )}
          </div>

          {/* Winner overlay */}
          {winner && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in zoom-in duration-300">
              <h3 className="text-white text-7xl font-black italic mb-2 tracking-tighter uppercase">Game Over!</h3>
              <p className="text-yellow-400 text-4xl font-black uppercase mb-8">{winner} Wins!</p>

              <div className="flex items-center gap-10 mb-12 bg-white/10 p-10 rounded-[32px] border-2 border-white/20">
                <div className="text-center">
                  <p className="text-orange-400 font-black text-sm uppercase mb-1">{team1?.team_name ?? 'Team A'}</p>
                  <p className="text-white text-8xl font-black leading-none">{scoreA}</p>
                </div>
                <div className="text-white text-5xl font-thin opacity-30 italic">vs</div>
                <div className="text-center">
                  <p className="text-blue-400 font-black text-sm uppercase mb-1">{team2?.team_name ?? 'Team B'}</p>
                  <p className="text-white text-8xl font-black leading-none">{scoreB}</p>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={handleEndMatch}
                  className="bg-yellow-400 border-4 border-black px-16 py-6 font-black text-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:translate-y-[-4px] active:translate-y-1 transition-all uppercase"
                >
                  Next Match
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={() => setView('queue_detail')} className="mt-10 flex flex-col items-center group">
          <span className="font-bold text-sm underline uppercase tracking-widest text-gray-500">See Queue</span>
          <span className="text-4xl leading-none font-black animate-bounce mt-2 text-gray-400">⌄</span>
        </button>

        {/* ── AI Prediction panel ── */}
        {match?.ongoing && team1 && team2 && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="flex justify-center">
              <button
                onClick={() => setShowPrediction(prev => !prev)}
                className="px-6 py-2 bg-black text-yellow-400 border-2 border-yellow-400 font-black uppercase text-xs tracking-widest hover:bg-gray-900 transition-all"
              >
                {showPrediction ? '▼ Hide AI' : '🤖 AI Predict'}
              </button>
            </div>
            <div className={`bg-[#1a1a1a] border-t-4 border-yellow-400 overflow-hidden transition-all duration-300 ${showPrediction ? 'max-h-96' : 'max-h-0'}`}>
              <div className="p-4 max-w-2xl mx-auto">
                <MatchPredictor
                  match={match}
                  score_limit={scoreLimit}
                  autoPredict={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Queue detail view ─────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center pt-16 px-4 relative text-black text-center">
      <button onClick={() => setView('scoreboard')} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
        ← Back to Scoreboard
      </button>

      <h2 className="text-4xl font-black italic uppercase mb-8 mt-4 tracking-tighter">
        {selectedCourtName}
      </h2>

      <div className="w-full max-w-xl flex flex-col gap-4 text-center items-center">
        <h3 className="text-xl font-black italic uppercase text-gray-400 text-left mb-[-8px] w-full">
          Currently Playing
        </h3>

        {playingTeams.length >= 2 ? (
          <div className="grid grid-cols-2 gap-4 w-full">
            {playingTeams.slice(0, 2).map((entry, i) => (
              <div key={entry.teamID} className="bg-yellow-400 border-4 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-xs font-black uppercase text-black/50 block mb-1">Side {i === 0 ? 'A' : 'B'}</span>
                <span className="text-2xl font-black uppercase text-black tracking-widest">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full bg-gray-100 border-2 border-black p-6">
            <p className="font-black uppercase text-gray-400 text-sm">No match in progress</p>
          </div>
        )}

        <div className="flex items-center gap-4 mt-8 mb-2 w-full">
          <div className="h-[2px] flex-1 bg-black/10"></div>
          <h3 className="text-2xl font-black italic uppercase text-black">The Queue</h3>
          <div className="h-[2px] flex-1 bg-black/10"></div>
        </div>

        {waitingTeams.length === 0 ? (
          <p className="font-bold text-gray-400 uppercase text-sm">No teams waiting</p>
        ) : (
          <div className="flex flex-col gap-3 pb-20 w-full">
            {waitingTeams.map((entry, i) => (
              <div key={entry.teamID} className="bg-orange-400 border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black italic opacity-30">#{i + 1}</span>
                  <div className="text-left">
                    <span className="text-xl font-black uppercase text-white tracking-tight block">
                      {entry.name ?? entry.teamID}
                    </span>
                    {entry.status === 'on_deck' && (
                      <span className="text-xs font-black uppercase text-yellow-200">⏳ On Deck</span>
                    )}
                    {entry.skill_level && (
                      <span className="text-xs font-black uppercase text-white/60">{entry.skill_level}</span>
                    )}
                  </div>
                </div>
                {entry.teamID === user?.teamID && (
                  <span className="text-xs font-black uppercase bg-white text-black px-2 py-1 border-2 border-black">You</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}