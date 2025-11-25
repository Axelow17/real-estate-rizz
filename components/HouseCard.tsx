import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  fid: number;
  level: number;
  ownerName?: string;
  pfpUrl?: string;
  votes?: number;
  miningRate?: number;
  avgStayDuration?: number;
  onVote?: () => void;
  onStay?: () => void;
};

export function HouseCard({ fid, level, ownerName, pfpUrl, votes, miningRate, avgStayDuration, onVote, onStay }: Props) {
  const router = useRouter();
  const src = `/houses/level${level}.png`;

  const handleClick = () => {
    router.push(`/profile/${fid}`);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer rounded-3xl bg-white shadow-md p-4 flex flex-col items-center gap-2 hover:shadow-lg transition">
      <div className="relative w-40 h-40">
        <Image src={src} alt={`House level ${level}`} fill className="object-contain" />
      </div>
      <div className="text-center text-sm">
        {ownerName && (
          <div className="flex items-center justify-center gap-2 mb-1">
            {pfpUrl ? (
              <img
                src={pfpUrl}
                alt={`${ownerName}'s profile`}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-bg font-bold text-xs">
                  {ownerName.slice(1, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="font-semibold">@{ownerName}</div>
          </div>
        )}
        <div className="text-xs text-[#6c5a9b]">Level {level}</div>
        {miningRate && <div className="text-xs text-primary/70">Mining: {miningRate}/hr</div>}
        {avgStayDuration && <div className="text-xs text-primary/70">Avg Stay: {avgStayDuration}h</div>}
        {typeof votes === "number" && (
          <div className="text-[11px] text-[#ff8f6b] mt-1">❤️ {votes} votes</div>
        )}
      </div>
      <div className="flex gap-3 w-full">
        {onVote && (
          <button
            onClick={(e) => { e.stopPropagation(); onVote(); }}
            className="flex-1 py-2 rounded-full bg-primary text-bg text-sm font-semibold"
          >
            VOTE
          </button>
        )}
        {onStay && (
          <button
            onClick={(e) => { e.stopPropagation(); onStay(); }}
            className="flex-1 py-2 rounded-full bg-white border border-primary text-primary text-sm font-semibold"
          >
            STAY
          </button>
        )}
      </div>
    </div>
  );
}
