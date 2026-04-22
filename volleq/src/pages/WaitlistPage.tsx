import { useState, JSX } from "react";
import { useUserSync } from "../store/user";
import { useUserStore } from "../store/user";

interface Props {
  onBack: () => void;
  isHost?: boolean;
  initialWinningScore?: number; 
}

type WaitlistView = "court_list" | "scoreboard" | "queue_detail";

export default function WaitlistPage({ 
  onBack, 
  isHost = false, 
  initialWinningScore = 21 
}: Props): JSX.Element {

  useUserSync();
  const [view, setView] = useState<WaitlistView>("court_list");
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [myCurrentCourt, setMyCurrentCourt] = useState<string | null>(null);

  // --- SCOREBOARD STATE ---
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winningScore] = useState(initialWinningScore); 
  const [winner, setWinner] = useState<string | null>(null);

  const courts = [
    { id: 1, name: "COURT 1", status: "Waiting for teams...", count: 0, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 2, name: "COURT 2", status: "Tigers vs Lions", count: 4, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 3, name: "COURT 3", status: "Beans vs Toast", count: 1, color: "bg-gradient-to-r from-orange-400 to-yellow-400" },
  ];

  const handleJoinCourt = (name: string) => {
    setMyCurrentCourt(name);
    setSelectedCourt(name);
    setView("scoreboard");
  };

  const handleLeaveCourt = () => {
    setMyCurrentCourt(null);
  };

  const user = useUserStore((state) => state.user);
  user?.teamID
  // make a useEffect hook for getting the courts

  const updateScore = (team: 'A' | 'B', delta: number) => {
    if (winner) return;
    if (team === 'A') {
      const newScore = Math.max(0, scoreA + delta);
      setScoreA(newScore);
      if (newScore >= winningScore) setWinner("Team A");
    } else {
      const newScore = Math.max(0, scoreB + delta);
      setScoreB(newScore);
      if (newScore >= winningScore) setWinner("Team B");
    }
  };

  const resetGame = () => {
    setScoreA(0);
    setScoreB(0);
    setWinner(null);
  };

  // --- 1. COURT LIST VIEW ---
  if (view === "court_list") {
    return (
      <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center pt-16 px-4 relative text-black text-center">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Lobby
        </button>

        <div className="w-full max-w-2xl flex flex-col gap-4 relative mt-4">
          <h2 className="text-2xl font-black uppercase italic mb-2">
            {isHost ? "Court Management" : "Available Courts"}
          </h2>

          {courts.map((court) => {
            const isMyCourt = myCurrentCourt === court.name;
            return (
              <div key={court.id} className="flex flex-col gap-2">
                <div
                  onClick={() => { setSelectedCourt(court.name); setView("scoreboard"); }}
                  className={`${court.color} border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center transition-all cursor-pointer hover:translate-y-[-2px] relative ${
                    isMyCourt ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#fefce8]" : ""
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
                    <span className="text-5xl font-black block leading-none">{court.count + (isMyCourt ? 1 : 0)}</span>
                    <span className="text-[10px] font-bold uppercase leading-none opacity-60">In Queue</span>
                  </div>
                </div>

                {isHost && (
                  <div className="flex gap-2 mb-4">
                    {isMyCourt ? (
                      <button onClick={(e) => { e.stopPropagation(); handleLeaveCourt(); }} className="flex-1 bg-red-500 text-white border-2 border-black font-black uppercase text-xs py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">Leave Queue</button>
                    ) : (
                      !myCurrentCourt && <button onClick={(e) => { e.stopPropagation(); handleJoinCourt(court.name); }} className="flex-1 bg-green-500 text-white border-2 border-black font-black uppercase text-xs py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">Join Queue</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- ADDED: PLAYER-ONLY STATUS BAR --- (if you're not on a team, you won't see it) */}
        {!isHost && user?.teamID && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border-4 border-black p-4 flex items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 animate-bounce-subtle">
            <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center">
              <span className="animate-pulse text-xl">⏳</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black uppercase text-xs tracking-tighter text-gray-400">Status</span>
              <span className="font-black uppercase text-sm leading-tight">Host is currently selecting a court...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 2. SCOREBOARD VIEW ---
  if (view === "scoreboard") {
    return (
      <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center justify-center px-4 relative text-black text-center">
        <button onClick={() => setView("court_list")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Courts
        </button>

        <h2 className="text-3xl font-black italic uppercase mt-8 mb-4 tracking-tighter">{selectedCourt}</h2>

        <div className="flex items-center gap-2 mb-6 bg-white border-2 border-black px-4 py-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-black uppercase text-gray-400">Match Goal:</span>
          <span className="text-lg font-black text-orange-600">{winningScore} PTS</span>
        </div>

        <div className="flex w-full max-w-6xl aspect-[16/10] border-4 border-black rounded-[40px] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative bg-black">
          
          <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center border-r-4 border-black relative">
            <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreA}</span>
            <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">Team A</span>
            
            <div className="absolute inset-y-0 left-8 flex flex-col justify-center gap-6 z-[60]">
              <button onClick={() => updateScore('A', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">+</button>
              <button onClick={() => updateScore('A', -1)} className="w-20 h-20 bg-orange-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">-</button>
            </div>
          </div>

          <div className="flex-1 bg-blue-500 flex flex-col items-center justify-center relative">
            <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreB}</span>
            <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">Team B</span>
            
            <div className="absolute inset-y-0 right-8 flex flex-col justify-center gap-6 z-[60]">
              <button onClick={() => updateScore('B', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">+</button>
              <button onClick={() => updateScore('B', -1)} className="w-20 h-20 bg-blue-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">-</button>
            </div>
          </div>

          {winner && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in zoom-in duration-300">
               <h3 className="text-white text-7xl font-black italic mb-2 tracking-tighter uppercase">Game Over!</h3>
               <p className="text-yellow-400 text-4xl font-black uppercase mb-8">{winner} Wins!</p>
               
               <div className="flex items-center gap-10 mb-12 bg-white/10 p-10 rounded-[32px] border-2 border-white/20">
                  <div className="text-center">
                     <p className="text-orange-400 font-black text-sm uppercase mb-1">Team A</p>
                     <p className="text-white text-8xl font-black leading-none">{scoreA}</p>
                  </div>
                  <div className="text-white text-5xl font-thin opacity-30 italic">vs</div>
                  <div className="text-center">
                     <p className="text-blue-400 font-black text-sm uppercase mb-1">Team B</p>
                     <p className="text-white text-8xl font-black leading-none">{scoreB}</p>
                  </div>
               </div>

               <button onClick={resetGame} className="bg-yellow-400 border-4 border-black px-16 py-6 font-black text-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:translate-y-[-4px] active:translate-y-1 transition-all uppercase">New Match</button>
            </div>
          )}
        </div>

        <button onClick={() => setView("queue_detail")} className="mt-10 flex flex-col items-center group">
          <span className="font-bold text-sm underline uppercase tracking-widest text-gray-500">See Queue</span>
          <span className="text-4xl leading-none font-black animate-bounce mt-2 text-gray-400">⌄</span>
        </button>
      </div>
    );
  }

  // --- 3. QUEUE DETAIL VIEW ---
  return (
    <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center pt-16 px-4 relative text-black text-center">
      <button onClick={() => setView("scoreboard")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
        ← Back to Scoreboard
      </button>

      <h2 className="text-4xl font-black italic uppercase mb-8 mt-4 tracking-tighter">{selectedCourt}</h2>

      <div className="w-full max-w-xl flex flex-col gap-4 text-center items-center">
        <h3 className="text-xl font-black italic uppercase text-gray-400 text-left mb-[-8px] w-full">Currently Playing</h3>
        <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-yellow-400 border-4 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black uppercase text-black/50 block mb-1">Side A</span>
              <span className="text-2xl font-black uppercase text-black tracking-widest">Team A</span>
            </div>
            <div className="bg-yellow-400 border-4 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black uppercase text-black/50 block mb-1">Side B</span>
              <span className="text-2xl font-black uppercase text-black tracking-widest">Team B</span>
            </div>
        </div>

        <div className="flex items-center gap-4 mt-8 mb-2 w-full">
          <div className="h-[2px] flex-1 bg-black/10"></div>
          <h3 className="text-2xl font-black italic uppercase text-black">The Queue</h3>
          <div className="h-[2px] flex-1 bg-black/10"></div>
        </div>

        <div className="flex flex-col gap-3 pb-20 w-full">
          {["Team C", "Team D", "Team E"].map((team, i) => (
            <div key={i} className={`bg-orange-400 border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black italic opacity-30">#{i + 1}</span>
                <span className="text-xl font-black uppercase text-white tracking-tight">{team}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}