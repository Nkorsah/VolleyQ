import { useState, JSX } from "react";
import { CreateCourtRequest, createCourt } from "../api/api";
import { useParams } from "react-router-dom";
import { useUserSync, useUserStore } from "../store/user";
import { useEffect } from "react";
import { deleteCourt } from "../api/api";

interface Props {
  onBack: () => void;
}

type HostView = "settings" | "select_queue" | "hosted";

export default function HostCourtPage({ onBack }: Props): JSX.Element {
  useUserSync();
  const user = useUserStore((state) => state.user);
  const [view, setView] = useState<HostView>("settings");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { venueID } = useParams();

  // --- NEW EDITABLE STATE ---
  const [maxTeams, setMaxTeams] = useState(8);
  const [courtName, setCourtName] = useState("COURT 1");
  const [courtID, setCourtID] = useState("");
  const [scoreLimit, setScoreLimit] = useState(25);

  type QueueType = "FIFO" | "PRIORITY QUEUE" | "CIRCULAR";

  const queueOptions = [
    {
      type: "FIFO" as QueueType,
      title: "FIFO",
      description: "Join the standard line...",
      icon: "⬛",
    },
    {
      type: "PRIORITY QUEUE" as QueueType,
      title: "PRIORITY QUEUE",
      description: "Get scheduled based on priority...",
      icon: "🥞",
    },
    {
      type: "CIRCULAR" as QueueType,
      title: "CIRCULAR QUEUE", // 👈 UI only
      description: "Stay in rotation...",
      icon: "🔄",
    },
  ];

  useEffect(() => {
    if (!user) return;

    if (user.hosted_courtID && view === "settings") {
      setView("hosted");
    }

  }, [user]);

  const currentQueue = queueOptions[currentIndex];

  const createNewCourt = () => {
    if (!venueID) {
      console.error("venueID is missing");
      return; // or show UI error
    }

    const court_settings = {
      court_name: courtName,
      max_teams_in_queue: maxTeams,
      queue_type: currentQueue.type,
      score_limit: scoreLimit,
      venueID: venueID,
    };
    // setCourtID()
    createCourt(court_settings);
    setView("hosted");
  };

  const handleCloseCourt = async (courtID: string) => {
    // handle closing court
    if(!user?.hosted_courtID){
      return;
    }
    const res = await deleteCourt(courtID);
    console.log("this is where we close the court!!");
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
          <h2 className="text-xl font-black mb-6 uppercase tracking-tight text-left italic">
            Host a Court
          </h2>

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
                <span className="font-bold text-lg w-4 text-center">
                  {maxTeams}
                </span>
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
                onChange={(e) =>{ setCourtName(e.target.value.toUpperCase())
                }
                }
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
                <span className="text-xl group-hover:translate-x-1 transition-transform">
                  {">"}
                </span>
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
                <span className="font-bold text-lg w-8 text-center">
                  {scoreLimit}
                </span>
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
              onClick={() => createNewCourt()}
              className="w-full py-4 bg-[#f7e49a] border-2 border-black font-black text-xl rounded-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-[#f2db82]"
            >
              Create Court
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
          <button
            onClick={handlePrev}
            className="text-7xl font-light hover:scale-110 transition-transform p-4"
          >
            {"<"}
          </button>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="text-8xl mb-8">{currentQueue.icon}</div>
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

          <button
            onClick={handleNext}
            className="text-7xl font-light hover:scale-110 transition-transform p-4"
          >
            {">"}
          </button>
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
        <h1 className="text-8xl font-black mb-8 italic tracking-tighter uppercase leading-none">
          {courtName} Hosted!
        </h1>
        <p className="text-2xl font-bold mb-12 leading-tight uppercase">
          Queue: {currentQueue.title} <br />
          Score: {scoreLimit} PTS
        </p>

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => {
              if (!user?.hosted_courtID) return;
              handleCloseCourt(user?.hosted_courtID)}}
            className="px-8 py-3 bg-[#f87171] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase"
          >
            Close Court
          </button>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-[#f7e49a] border-2 border-black font-bold text-lg rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase"
          >
            Go to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
