"use client";

import { useEffect, useState } from "react";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { HouseCard } from "@/components/HouseCard";

type LeaderboardEntry = {
  host_fid: number;
  username: string;
  pfp_url?: string;
  level: number;
  votesCount: number;
};

export default function LeaderboardPage() {
  const { user, loading, error } = useFarcasterUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoadingBoard(true);
      try {
        const res = await fetch("/api/leaderboard/weekly");
        const data = await res.json();
        if (!res.ok) {
          console.error(data);
          return;
        }
        setEntries(data.leaderboard || []);
        setFromDate(data.from || null);
      } finally {
        setLoadingBoard(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading leaderboard…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-red-500">{error}</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
        {fromDate && (
          <p className="text-[11px] text-primary/70 mt-1">
            Votes since {fromDate}
          </p>
        )}
      </header>

      {loadingBoard ? (
        <div className="text-xs text-primary/70">Loading data…</div>
      ) : entries.length === 0 ? (
        <div className="text-xs text-primary/70">
          Belum ada aktivitas vote minggu ini.
        </div>
      ) : (
        <section className="space-y-3">
          {entries.map((e, idx) => (
            <div
              key={e.host_fid}
              className="rounded-3xl bg-white shadow-md p-3 flex gap-3 items-center"
            >
              <div className="text-lg font-bold w-6 text-center">
                {idx + 1}
              </div>
              <div className="flex-1">
                <HouseCard
                  fid={e.host_fid}
                  level={e.level}
                  ownerName={`@${e.username}`}
                  votes={e.votesCount}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {user && (
        <footer className="mt-2 text-center text-[11px] text-primary/60">
          Kamu login sebagai <span className="font-semibold">@{user.username}</span>
        </footer>
      )}
    </main>
  );
}
