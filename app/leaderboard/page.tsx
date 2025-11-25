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

type Tab = "weekly" | "alltime" | "toprizz";

export default function LeaderboardPage() {
  const { user, loading, error } = useFarcasterUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("weekly");

  useEffect(() => {
    async function loadLeaderboard() {
      setLoadingBoard(true);
      try {
        let endpoint = "/api/leaderboard/weekly";
        if (activeTab === "alltime") endpoint = "/api/leaderboard/alltime";
        if (activeTab === "toprizz") endpoint = "/api/leaderboard/top-rizz";

        const res = await fetch(endpoint);
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
  }, [activeTab]);

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
      <header className="relative">
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="absolute left-0 top-0 p-2 text-primary/70 hover:text-primary"
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {activeTab === "weekly" ? "Weekly Leaderboard" :
             activeTab === "alltime" ? "All-Time Votes" : "Top Rizz"}
          </h1>
          {activeTab === "weekly" && fromDate && (
            <p className="text-[11px] text-primary/70 mt-1">
              Votes since {fromDate}
            </p>
          )}
        </div>
      </header>

      <nav className="flex gap-2 justify-center">
        <button
          onClick={() => setActiveTab("weekly")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab("weekly"); }}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            activeTab === "weekly" ? "bg-primary text-bg" : "bg-white text-primary"
          }`}
          aria-label="Show weekly leaderboard"
          aria-pressed={activeTab === "weekly" ? "true" : "false"}
        >
          Weekly
        </button>
        <button
          onClick={() => setActiveTab("alltime")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab("alltime"); }}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            activeTab === "alltime" ? "bg-primary text-bg" : "bg-white text-primary"
          }`}
          aria-label="Show all-time votes leaderboard"
          aria-pressed={activeTab === "alltime" ? "true" : "false"}
        >
          All-Time
        </button>
        <button
          onClick={() => setActiveTab("toprizz")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab("toprizz"); }}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            activeTab === "toprizz" ? "bg-primary text-bg" : "bg-white text-primary"
          }`}
          aria-label="Show top rizz leaderboard"
          aria-pressed={activeTab === "toprizz" ? "true" : "false"}
        >
          Top Rizz
        </button>
      </nav>

      {loadingBoard ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="rounded-3xl bg-white shadow-md p-3 flex gap-3 items-center animate-pulse">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-xs text-primary/70">
          {activeTab === "weekly" ? "No voting activity this week yet." :
           activeTab === "alltime" ? "No votes recorded yet." : "No houses found."}
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
                  ownerName={e.username}
                  pfpUrl={e.pfp_url}
                  votes={e.votesCount}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {user && (
        <footer className="mt-2 text-center text-[11px] text-primary/60">
          Logged in as <span className="font-semibold">@{user.username}</span>
        </footer>
      )}
    </main>
  );
}
