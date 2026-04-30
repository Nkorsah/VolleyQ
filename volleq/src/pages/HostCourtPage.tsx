import { useState, JSX } from "react";
import { useParams } from "react-router-dom";
import { createCourt } from "../api/api";
import { useUserStore } from "../store/user";
import { useEffect } from "react";
import { deleteCourt } from "../api/api";

interface Props {
  onBack: () => void;
}

type HostView = "settings" | "select_queue" | "hosted";

export default function HostCourtPage({ onBack }: Props): JSX.Element {
  const user = useUserStore((state) => state.user);
  const { venueID } = useParams<{ venueID: string }>();
  const [view, setView] = useState<HostView>("settings");
  const [currentIndex, setCurrentIndex] = useState(0);


  const [maxTeams, setMaxTeams] = useState(8);
  const [courtName, setCourtName] = useState("COURT 1");
  // const [courtName, setCourtName] = useState("Court_name");
  const [courtID, setCourtID] = useState("");
  const [scoreLimit, setScoreLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queueOptions = [
    {
      title: "FIFO",
      description: "Join the standard line. You'll play in the exact order you signed up.",
      icon: "⬛" 
    },
    {
      title: "PRIORITY QUEUE",
      description: "Get scheduled based on priority competitive level, ranking, or a special attribute when you play.",
      icon: "🥞" 
    },
    {
      title: "CIRCULAR QUEUE",
      description: "Stay in rotation once you finish a game, you go back into the cycle and will play again when your turn comes around.",
      icon: "🔄" 
    }
  ];

  // const handleNext = () => setCurrentIndex((prev) => (prev + 1) % queueOptions.length);
  // const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + queueOptions.length) % queueOptions.length);

  useEffect(() => {
    if (!user) return;

    console.log("courtID: ", user.hosted_courtID)

    if (user.hosted_courtID) {
      setView("hosted");
    } else {
      setView("settings");
    }


  }, [user]);


  const currentQueue = queueOptions[currentIndex];

  const handleCreateCourt = async () => {
    if (!venueID) return;
    setLoading(true);
    setError(null);
    try {
      await createCourt({
        court_name: courtName,
        max_teams_in_queue: maxTeams,
        queue_type: currentQueue.title as 'FIFO' | 'CIRCULAR' | 'PRIORITY QUEUE',
        score_limit: scoreLimit,
        venueID,
      });

      setView("hosted");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create court");
    } finally {
      setLoading(false);
    }

  };

  const handleCloseCourt = async (courtID: string) => {
    // handle closing court
    console.log('closing court!!!')
    if(!user?.hosted_courtID){
      return;
    }

    try {
      
      await deleteCourt(courtID);
      onBack();
    } catch(err) {
      console.error("delete court failed:", err);
    }
   
  };

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % queueOptions.length);
  const handlePrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + queueOptions.length) % queueOptions.length,
    );

  // --- 1. SETTINGS VIEW ---
  if (view === "settings") {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 w-full max-w-2xl mx-auto relative text-black">
        <button 
          onClick={onBack} 
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Back to Map
        </button>

        <div className="w-full bg-[#fdf2d1] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
          <h2 className="text-xl font-black mb-6 uppercase tracking-tight text-left italic">Host a Court</h2>
          
          <div className="space-y-4">
            
            {/* MAXIMUM TEAMS - WITH NEW BUTTON STYLES */}
            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span className="uppercase text-sm">Maximum Teams</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMaxTeams(Math.max(2, maxTeams - 1))}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-bold text-lg w-4 text-center">{maxTeams}</span>
                <button 
                  onClick={() => setMaxTeams(maxTeams + 1)}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* COURT NAME */}
            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span className="uppercase text-sm">Court Name</span>
              <input 
                type="text" 
                value={courtName} 
                onChange={(e) => setCourtName(e.target.value.toUpperCase())}
                className="bg-transparent text-right outline-none border-b-2 border-black w-32 uppercase focus:border-orange-600 transition-colors"
              />
            </div>

            {/* QUEUE TYPE */}
            <div 
              onClick={() => setView("select_queue")}
              className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold cursor-pointer hover:bg-[#f2db82] transition-colors group"
            >
              <span className="uppercase text-sm">Queue Type</span>
              <span className="flex items-center gap-2">
                {currentQueue.title} 
                <span className="text-xl group-hover:translate-x-1 transition-transform">{">"}</span>
              </span>
            </div>

            {/* SCORE LIMIT - WITH NEW BUTTON STYLES */}
            <div className="flex justify-between items-center bg-[#f7e49a] border-2 border-black p-3 font-bold">
              <span className="uppercase text-sm">Score Limit</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setScoreLimit(Math.max(1, scoreLimit - 1))}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-bold text-lg w-8 text-center">{scoreLimit}</span>
                <button 
                  onClick={() => setScoreLimit(scoreLimit + 1)}
                  className="w-8 h-8 bg-white border-2 border-black font-black hover:bg-gray-100 active:translate-y-0.5 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          <div className="mt-12">
            <button 
              onClick={handleCreateCourt} 
              disabled={loading}
              className="w-full py-4 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-[#f2db82] disabled:opacity-50"
              
            >
              {loading ? "Creating..." : "Create Court"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. QUEUE SELECTION VIEW ---
  if (view === "select_queue") {
    return (
      <div className="flex-1 flex items-center justify-center px-4 relative text-black">
        <button 
          onClick={() => setView("settings")} 
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Back to Settings
        </button>

        <div className="flex items-center gap-12 max-w-4xl w-full">
          <button onClick={handlePrev} className="text-7xl font-light hover:scale-110 transition-transform p-4">{'<'}</button>
          
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="text-8xl mb-8">{currentQueue.icon}</div>
            <h2 className="text-7xl font-extrabold mb-6 italic tracking-tighter uppercase">{currentQueue.title}</h2>
            <p className="text-xl font-bold text-gray-800 max-w-md mb-10 leading-snug">{currentQueue.description}</p>
            <button 
              onClick={() => setView("settings")}
              className="px-16 py-3 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase"
            >
              SELECT
            </button>
          </div>

          <button onClick={handleNext} className="text-7xl font-light hover:scale-110 transition-transform p-4">{'>'}</button>
        </div>
      </div>
    );
  }

  // --- 3. COURT HOSTED VIEW ---
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative text-black">
       <button 
          onClick={onBack} 
          className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
        >
          ← Home
        </button>

      <div className="w-full max-w-2xl bg-[#93c5fd] border-4 border-black p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-8xl font-black mb-8 italic tracking-tighter uppercase leading-none">{courtName} Hosted!</h1>
        <p className="text-2xl font-bold mb-12 leading-tight uppercase">
          Queue: {currentQueue.title} <br/>
          Score: {scoreLimit} PTS
        </p>

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => {
              if (!user?.hosted_courtID) return;
              handleCloseCourt(user?.hosted_courtID)}
              
            }
            className="px-8 py-3 bg-[#f87171] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase"
          >
            Close Court
          </button>
          <button onClick={onBack} className="px-8 py-3 bg-[#f7e49a] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
            Go to Menu
          </button>
        </div>
      </div>
    </div>
  );
}