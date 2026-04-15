import { useState, JSX } from "react";

interface Props {
  onBack: () => void;
  isHost?: boolean; 
}

type WaitlistView = "court_list" | "scoreboard" | "queue_detail";

export default function WaitlistPage({ onBack, isHost = false }: Props): JSX.Element {
  const [view, setView] = useState<WaitlistView>("court_list");
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  // --- SCOREBOARD STATE ---
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winningScore, setWinningScore] = useState(25); 
  const [winner, setWinner] = useState<string | null>(null);

  const courts = [
    { id: 1, name: "COURT 1", status: "Waiting for teams...", count: 0, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 2, name: "COURT 2", status: "Tigers vs Lions", count: 4, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 3, name: "COURT 3", status: "Beans vs Toast", count: 1, color: "bg-gradient-to-r from-orange-400 to-yellow-400" },
  ];

  const handleCourtClick = (name: string) => {
    // Only the host can move the team into a court's scoreboard/queue
    if (!isHost) return;
    setSelectedCourt(name);
    setView("scoreboard");
  };

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

  // --- 1. COURT SELECTION VIEW ---
  if (view === "court_list") {
    return (
      <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-2xl mx-auto relative text-black">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Lobby
        </button>
        
        <div className="w-full flex flex-col gap-4 relative mt-4">
          <h2 className="text-2xl font-black uppercase italic mb-2">
            {isHost ? "Select a Court" : "Available Courts"}
          </h2>

          {courts.map((court) => (
            <div 
              key={court.id} 
              onClick={() => handleCourtClick(court.name)}
              className={`${court.color} border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center transition-all ${
                isHost ? "cursor-pointer hover:translate-y-[-2px]" : "cursor-default opacity-90"
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
                  <span className="text-5xl font-black block leading-none">{court.count}</span>
                  <span className="text-[10px] font-bold uppercase leading-none">Teams in queue</span>
               </div>
            </div>
          ))}

          {/* MESSAGE ONLY FOR NON-HOSTS */}
          {!isHost && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#d97706] border-2 border-black rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl z-50">
               <div className="w-10 h-10 rounded-full border-2 border-black bg-blue-200 overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Host" alt="host" />
               </div>
               <span className="font-bold uppercase tracking-tight text-white">Host is choosing a court...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 2. SCOREBOARD VIEW ---
  if (view === "scoreboard") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 w-full h-full min-h-screen relative text-black">
        <button onClick={() => setView("court_list")} className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline">
          ← Back to Courts
        </button>

        <h2 className="text-3xl font-black mb-4 italic uppercase mt-8">Match - {selectedCourt}</h2>
        
        <div className="flex items-center gap-4 mb-6 bg-gray-100 p-2 rounded-xl border-2 border-black">
          <span className="text-xs font-black uppercase px-2">Set Match To:</span>
          <button 
            disabled={!isHost}
            onClick={() => { resetGame(); setWinningScore(18); }}
            className={`px-4 py-1 font-black rounded-lg transition-all ${winningScore === 18 ? 'bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-400'}`}
          >18 PTS</button>
          <button 
            disabled={!isHost}
            onClick={() => { resetGame(); setWinningScore(25); }}
            className={`px-4 py-1 font-black rounded-lg transition-all ${winningScore === 25 ? 'bg-blue-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-400'}`}
          >25 PTS</button>
        </div>

        <div className="flex w-full max-w-6xl aspect-[16/10] border-4 border-black rounded-[40px] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative bg-black">
          {/* Team A Side */}
          <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center border-r-4 border-black relative">
             <span className="text-[180px] md:text-[280px] font-black leading-none text-white">{scoreA}</span>
             <span className="text-3xl font-black text-white uppercase">Team A</span>
             {isHost && (
                <div className="absolute inset-y-0 left-6 flex flex-col justify-center gap-6">
                    <button onClick={() => updateScore('A', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">+</button>
                    <button onClick={() => updateScore('A', -1)} className="w-20 h-20 bg-orange-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">-</button>
                </div>
             )}
          </div>

          {/* Team B Side */}
          <div className="flex-1 bg-blue-500 flex flex-col items-center justify-center relative">
             <span className="text-[180px] md:text-[280px] font-black leading-none text-white">{scoreB}</span>
             <span className="text-3xl font-black text-white uppercase">Team B</span>
             {isHost && (
                <div className="absolute inset-y-0 right-6 flex flex-col justify-center gap-6">
                    <button onClick={() => updateScore('B', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">+</button>
                    <button onClick={() => updateScore('B', -1)} className="w-20 h-20 bg-blue-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">-</button>
                </div>
             )}
          </div>

          {winner && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50">
               <h3 className="text-white text-7xl font-black italic mb-2 uppercase tracking-tighter">Game Over!</h3>
               <p className="text-yellow-400 text-4xl font-black uppercase mb-8">{winner} Wins!</p>
               {isHost && (
                 <button onClick={resetGame} className="bg-yellow-400 border-4 border-black px-16 py-6 font-black text-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:translate-y-[-4px] transition-all uppercase">New Match</button>
               )}
            </div>
          )}
        </div>

        <button onClick={() => setView("queue_detail")} className="mt-10 flex flex-col items-center group">
          <span className="font-bold text-sm underline uppercase tracking-widest">See Queue</span>
          <span className="text-4xl leading-none font-black animate-bounce mt-2">⌄</span>
        </button>
      </div>
    );
  }

  // --- 3. QUEUE DETAIL VIEW (FIXED BACKGROUND COLOR) ---
  const activeTeams = ["Team A", "Team B"]; 
  const queuedTeams = [
    { name: "Team C", color: "bg-blue-500" },
    { name: "Team D", color: "bg-orange-400" },
    { name: "Team E", color: "bg-blue-400" },
    { name: "Team F", color: "bg-orange-500" },
  ];

  return (
    /* Changed to bg-[#fefce8] which is a very light yellow, and forced min-h-screen */
    <div className="min-h-screen w-full bg-[#fefce8] flex flex-col items-center pt-16 px-4 relative text-black">
      <button 
        onClick={() => setView("scoreboard")} 
        className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
      >
        ← Back to Game
      </button>

      <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter mt-4">{selectedCourt}</h2>
      
      <div className="w-full max-w-xl flex flex-col gap-4">
        {/* ACTIVE TEAMS SECTION */}
        <h3 className="text-xl font-black italic uppercase text-gray-500 mb-[-8px]">Currently Playing</h3>
        <div className="grid grid-cols-2 gap-4">
          {activeTeams.map((team, index) => (
            <div 
              key={index} 
              className="bg-yellow-400 border-4 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-xs font-black uppercase text-black/50 block mb-1">Side {index === 0 ? 'A' : 'B'}</span>
              <span className="text-2xl font-black uppercase text-black tracking-widest">{team}</span>
            </div>
          ))}
        </div>

        {/* QUEUE SECTION */}
        <div className="flex items-center gap-4 mt-8 mb-2">
          <div className="h-[2px] flex-1 bg-black"></div>
          <h3 className="text-2xl font-black italic uppercase">Waiting in Queue</h3>
          <div className="h-[2px] flex-1 bg-black"></div>
        </div>

        <div className="flex flex-col gap-3 pb-10">
          {queuedTeams.map((team, i) => (
            <div 
              key={i} 
              className={`${team.color} border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black italic opacity-30">#{i + 1}</span>
                <span className="text-xl font-black uppercase text-white tracking-tight">{team.name}</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Waiting</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}