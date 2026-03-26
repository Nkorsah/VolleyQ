import { useState, JSX } from "react";

interface Props {
  onBack: () => void;
}

type HostView = "settings" | "select_queue" | "hosted";

export default function HostCourtPage({ onBack }: Props): JSX.Element {
  const [view, setView] = useState<HostView>("settings");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Data for the Carousel
  const queueOptions = [
    {
      title: "FIFO",
      description: "Join the standard line. You'll play in the exact order you signed up.",
      icon: "⬛" // Placeholder for the stacked icon
    },
    {
      title: "PRIORITY QUEUE",
      description: "Get scheduled based on priority competitive level, ranking, or a special attribute when you play.",
      icon: "🥞" // Placeholder for the priority stack icon
    },
    {
      title: "CIRCULAR QUEUE",
      description: "Stay in rotation once you finish a game, you go back into the cycle and will play again when your turn comes around.",
      icon: "🔄" // Placeholder for the circular dashed icon
    }
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % queueOptions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + queueOptions.length) % queueOptions.length);
  };

  const currentQueue = queueOptions[currentIndex];

  // --- 1. SETTINGS VIEW ---
  if (view === "settings") {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-2xl mx-auto">
        <div className="w-full bg-[#fdf2d1] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Host a Court</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span>Maximum Teams</span>
              <span>{'< 8 >'}</span>
            </div>
            
            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span>Court Name</span>
              <span className="border-b border-black px-2">COURT 1</span>
            </div>

            {/* Clickable Queue Type field */}
            <div 
              onClick={() => setView("select_queue")}
              className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold cursor-pointer hover:bg-[#f2db82] transition-colors"
            >
              <span>Queue Type</span>
              <span>{currentQueue.title} {'>'}</span>
            </div>

            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span>Score Limit</span>
              <span>{'< 25 >'}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button onClick={onBack} className="flex-1 py-3 bg-[#d1d5db] border-2 border-black font-bold rounded-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              Cancel
            </button>
            <button onClick={() => setView("hosted")} className="flex-1 py-3 bg-[#f7e49a] border-2 border-black font-bold rounded-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              Create Court
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. QUEUE SELECTION VIEW (Interactive Carousel) ---
  if (view === "select_queue") {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex items-center gap-12 max-w-4xl w-full">
          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            className="text-7xl font-light hover:scale-110 transition-transform p-4"
          >
            {'<'}
          </button>
          
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="text-8xl mb-8">
               {currentQueue.icon}
            </div>
            <h2 className="text-7xl font-extrabold mb-6 italic tracking-tighter uppercase">
              {currentQueue.title}
            </h2>
            <p className="text-xl font-bold text-gray-800 max-w-md mb-10 leading-snug">
              {currentQueue.description}
            </p>
            <button 
              onClick={() => setView("settings")}
              className="px-16 py-3 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase"
            >
              SELECT
            </button>
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            className="text-7xl font-light hover:scale-110 transition-transform p-4"
          >
            {'>'}
          </button>
        </div>
      </div>
    );
  }

  // --- 3. COURT HOSTED VIEW ---
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-[#93c5fd] border-4 border-black p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-8xl font-black mb-8 italic tracking-tighter uppercase">Court Hosted!</h1>
        
        <p className="text-2xl font-bold mb-12 leading-tight">
          You can either host or join a team to play!<br/>
          Or you can spectate.<br/>
          The choice is yours!
        </p>

        <div className="flex gap-6 justify-center">
          <button className="px-8 py-3 bg-[#f87171] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Close Court
          </button>
          <button onClick={onBack} className="px-8 py-3 bg-[#f7e49a] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}