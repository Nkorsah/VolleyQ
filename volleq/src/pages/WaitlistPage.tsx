import { useState, JSX } from "react";

interface Props {
  onBack: () => void;
}

type WaitlistView = "court_list" | "scoreboard" | "queue_detail";

export default function WaitlistPage({ onBack }: Props): JSX.Element {
  const [view, setView] = useState<WaitlistView>("court_list");
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  // Mock data for Court Selection (Frame 91)
  const courts = [
    { id: 1, name: "COURT 1", status: "Waiting for teams...", count: 0, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 2, name: "COURT 2", status: "Tigers vs Lions", count: 4, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: 3, name: "COURT 3", status: "Beans vs Toast", count: 1, color: "bg-gradient-to-r from-orange-400 to-yellow-400" },
  ];

  const handleCourtClick = (name: string) => {
    setSelectedCourt(name);
    setView("scoreboard");
  };

  // --- 1. COURT SELECTION VIEW (Frame 91) ---
  if (view === "court_list") {
    return (
      <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full max-w-2xl mx-auto">
        <button onClick={onBack} className="self-start mb-6 text-sm font-bold text-gray-600 hover:underline">← Back to Menu</button>
        
        <div className="w-full flex flex-col gap-4 relative">
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
                  <div className="flex flex-col">
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

          {/* Toast Notification (Frame 91 Overlay) */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#d97706] border-2 border-black rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl">
             <div className="w-10 h-10 rounded-full border-2 border-black bg-blue-200 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Christine" alt="host" />
             </div>
             <span className="font-bold uppercase tracking-tight">Host is choosing a court...</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. SCOREBOARD VIEW (Frame 92 Top/Middle) ---
  if (view === "scoreboard") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 w-full">
        <h2 className="text-3xl font-black mb-8 italic uppercase">Current Match - {selectedCourt}</h2>
        
        <div className="flex w-full max-w-3xl aspect-[16/9] border-4 border-black rounded-[40px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
          {/* Team A */}
          <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center border-r-4 border-black">
             <span className="text-[200px] font-black leading-none text-white">10</span>
             <span className="text-2xl font-black text-white uppercase tracking-widest mt-4">Team A</span>
             <div className="absolute left-[-20px] text-5xl font-light text-black">+</div>
          </div>
          {/* Team B */}
          <div className="flex-1 bg-blue-500 flex flex-col items-center justify-center">
             <span className="text-[200px] font-black leading-none text-white">2</span>
             <span className="text-2xl font-black text-white uppercase tracking-widest mt-4">Team B</span>
             <div className="absolute right-[-20px] text-5xl font-light text-black">+</div>
          </div>
        </div>

        <p className="mt-8 font-bold text-center max-w-lg">
          Team A has a 100% chance of winning with an undefeated record!
        </p>
        
        <button 
          onClick={() => setView("queue_detail")}
          className="mt-6 flex flex-col items-center group"
        >
          <span className="font-bold text-sm underline group-hover:no-underline transition-all">Click here to see queue</span>
          <span className="text-2xl leading-none font-black">v</span>
        </button>
      </div>
    );
  }

  // --- 3. QUEUE DETAIL VIEW (Frame 92 Bottom) ---
  return (
    <div className="flex-1 flex flex-col items-center pt-8 px-4 w-full">
      <button onClick={() => setView("scoreboard")} className="text-3xl font-black mb-4">^</button>
      <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">{selectedCourt}</h2>
      
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 border-2 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
           <span className="text-xl font-black uppercase">Team A vs Team B</span>
        </div>

        <h3 className="text-2xl font-black italic text-center mt-4">Next Up</h3>

        {[
          { teams: "Team C vs Team D", color: "bg-blue-500" },
          { teams: "Team E vs Team F", color: "bg-orange-400" },
          { teams: "Team G vs Team H", color: "bg-blue-400" },
        ].map((match, i) => (
          <div key={i} className={`${match.color} border-2 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
            <span className="text-xl font-black uppercase">{match.teams}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setView("court_list")} className="mt-12 font-bold underline">Back to Court List</button>
    </div>
  );
}