import { Team } from "../types/types";

interface Props {
  team: Team;
  maxPlayers: number;
  onJoin: (teamID: string) => void;
  isLoading?: boolean;
}

export default function TeamCard({
  team,
  maxPlayers,
  onJoin,
  isLoading,
}: Props) {
  return (
    <div className="bg-white border-2 border-black p-6 flex justify-between items-center w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-2">

        {/* TEAM NAME */}
        <p className="font-black text-2xl uppercase tracking-tight">
          {team.team_name}
        </p>

        {/* COUNT + AVATARS */}
        <div className="flex items-center gap-3">

          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            {team.members?.length || 0} / {maxPlayers} PLAYERS
          </p>

          <div className="flex -space-x-2">
            {team.members
              ?.slice(0, 3)
              .map((m, idx) => (
                <img
                  key={idx}
                  src={m.avatarUrl}
                  className="w-8 h-8 rounded-full border-2 border-black bg-white"
                  alt="avatar"
                />
              ))}
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <button
        onClick={() => onJoin(team.teamID)}
        disabled={isLoading}
        className="bg-[#f7e49a] border-2 border-black px-8 py-3 font-black uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
      >
        Join
      </button>
    </div>
  );
}