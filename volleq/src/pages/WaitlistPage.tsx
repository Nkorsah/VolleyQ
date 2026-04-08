import { useState, JSX } from "react";

interface Props {
  onBack: () => void;
}

type WaitlistView = "court_list" | "scoreboard" | "queue_detail";

export default function WaitlistPage({ onBack }: Props): JSX.Element {
  // --- NAVIGATION STATE ---
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
      <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-2xl mx-auto relative">
        {/* ALIGNED LEFT BACK BUTTON */}
        <button 
          onClick={onBack} 
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Back to Menu
        </button>
        
        <div className="w-full flex flex-col gap-4 relative mt-4">
          {courts.map((court) => (
            <div 
              key={court.id} 
              onClick={() => handleCourtClick(court.name)}
              className={`${court.color} border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center cursor-pointer hover:translate-y-[-2px] transition-all`}
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
                  <span className="text-[10px] font-bold uppercase leading-none text-black">Teams in queue</span>
               </div>
            </div>
          ))}

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#d97706] border-2 border-black rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl z-50">
             <div className="w-10 h-10 rounded-full border-2 border-black bg-blue-200 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Christine" alt="host" />
             </div>
             <span className="font-bold uppercase tracking-tight text-white">Host is choosing a court...</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. SCOREBOARD VIEW ---
  if (view === "scoreboard") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 w-full h-full min-h-screen relative">
        {/* ALIGNED LEFT BACK BUTTON */}
        <button 
          onClick={() => setView("court_list")} 
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Back to Courts
        </button>

        <h2 className="text-3xl font-black mb-4 italic uppercase mt-8 text-black">Current Match - {selectedCourt}</h2>
        
        <div className="flex items-center gap-4 mb-6 bg-gray-100 p-2 rounded-xl border-2 border-black">
          <span className="text-xs font-black uppercase px-2 text-black">Set Match To:</span>
          <button 
            onClick={() => { resetGame(); setWinningScore(18); }}
            className={`px-4 py-1 font-black rounded-lg transition-all ${winningScore === 18 ? 'bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-400'}`}
          >18 PTS</button>
          <button 
            onClick={() => { resetGame(); setWinningScore(25); }}
            className={`px-4 py-1 font-black rounded-lg transition-all ${winningScore === 25 ? 'bg-blue-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-400'}`}
          >25 PTS</button>
        </div>

        <div className="flex w-full max-w-6xl aspect-[16/10] border-4 border-black rounded-[40px] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative bg-black">
          
          <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center border-r-4 border-black relative">
             <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreA}</span>
             <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">Team A</span>
             <div className="absolute inset-y-0 left-6 flex flex-col justify-center gap-6">
                <button onClick={() => updateScore('A', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">+</button>
                <button onClick={() => updateScore('A', -1)} className="w-20 h-20 bg-orange-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">-</button>
             </div>
          </div>

          <div className="flex-1 bg-blue-500 flex flex-col items-center justify-center relative">
             <span className="text-[180px] md:text-[280px] font-black leading-none text-white select-none">{scoreB}</span>
             <span className="text-3xl font-black text-white uppercase tracking-[0.2em]">Team B</span>
             <div className="absolute inset-y-0 right-6 flex flex-col justify-center gap-6">
                <button onClick={() => updateScore('B', 1)} className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">+</button>
                <button onClick={() => updateScore('B', -1)} className="w-20 h-20 bg-blue-200 border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">-</button>
             </div>
          </div>

          {/* GAME OVER MODAL */}
          {winner && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
               <h3 className="text-white text-7xl font-black italic mb-2 tracking-tighter uppercase leading-none">Game Over!</h3>
               <p className="text-yellow-400 text-4xl font-black uppercase mb-8">{winner} Wins!</p>

               {/* FINAL SCORE DISPLAY */}
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

               <button 
                onClick={resetGame} 
                className="bg-yellow-400 border-4 border-black px-16 py-6 font-black text-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:translate-y-[-4px] active:translate-y-1 active:shadow-none transition-all uppercase"
               >
                 New Match
               </button>
            </div>
          )}
        </div>

        <button onClick={() => setView("queue_detail")} className="mt-10 flex flex-col items-center group">
          <span className="font-bold text-sm underline text-black uppercase tracking-widest">See Queue</span>
          <span className="text-4xl leading-none font-black animate-bounce mt-2 text-black">⌄</span>
        </button>
      </div>
    );
  }

  // --- 3. QUEUE DETAIL VIEW ---
  return (
    <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full min-h-screen relative text-black">
      {/* ALIGNED LEFT BACK BUTTON */}
      <button 
        onClick={() => setView("scoreboard")} 
        className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
      >
        ← Back to Game
      </button>

      <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter mt-4">{selectedCourt}</h2>
      
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 border-4 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
           <span className="text-2xl font-black uppercase text-white tracking-widest">Active: Team A vs Team B</span>
        </div>

        <h3 className="text-2xl font-black italic text-center mt-6 uppercase">Next Up</h3>

        {[
          { teams: "Team C vs Team D", color: "bg-blue-500" },
          { teams: "Team E vs Team F", color: "bg-orange-400" },
          { teams: "Team G vs Team H", color: "bg-blue-400" },
        ].map((match, i) => (
          <div key={i} className={`${match.color} border-2 border-black p-5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
            <span className="text-xl font-black uppercase text-white">{match.teams}</span>
          </div>
        ))}
      </div>
    </div>
  );
}