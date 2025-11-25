"use client";

type Props = {
  username: string;
  rizzPoint: number;
  pfpUrl?: string;
};

export function RizzHeader({ username, rizzPoint, pfpUrl }: Props) {
  const initials = username.slice(0, 1).toUpperCase();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden">
          {pfpUrl ? (
            <img
              src={pfpUrl}
              alt={`${username}'s profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initial if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="text-bg font-bold text-lg">${initials}</span>`;
              }}
            />
          ) : (
            <span className="text-bg font-bold text-lg">{initials}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-primary/70">
            RealEstate Rizz
          </span>
          <span className="font-semibold text-sm">@{username}</span>
        </div>
      </div>
      <div className="px-3 py-2 rounded-2xl bg-primary text-bg text-right">
        <div className="text-lg font-bold leading-none">{rizzPoint}</div>
        <div className="text-[10px] uppercase tracking-wide leading-tight">
          Rizz
          <span className="block">Point</span>
        </div>
      </div>
    </header>
  );
}
