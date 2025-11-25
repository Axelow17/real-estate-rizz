"use client";

import { useEffect, useState } from "react";
import { HouseCard } from "@/components/HouseCard";
import { getSupabaseClient } from "@/lib/supabaseClient";

type LeaderboardEntry = {
  host_fid: number;
  username: string;
  pfp_url?: string;
  level: number;
  votesCount?: number;
  currentRizz?: number;
  baseRizz?: number;
  miningRate?: number;
};

type Tab = "weekly" | "alltime" | "toprizz";

interface LeaderboardProps {
  limit?: number;
  showTabs?: boolean;
  defaultTab?: Tab;
  className?: string;
}

export default function Leaderboard({ limit = 5, showTabs = true, defaultTab = "weekly", className = "" }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
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
        setEntries((data.leaderboard || []).slice(0, limit));
        setFromDate(data.from || null);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [activeTab, limit]);

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const leaderboardChannel = getSupabaseClient()
        .channel('leaderboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'houses'
          },
          (payload: any) => {
            console.log('Leaderboard house update:', payload);
            setTimeout(() => {
              let endpoint = "/api/leaderboard/weekly";
              if (activeTab === "alltime") endpoint = "/api/leaderboard/alltime";
              if (activeTab === "toprizz") endpoint = "/api/leaderboard/top-rizz";

              fetch(endpoint).then(res => res.json()).then(data => {
                if (data.leaderboard) {
                  setEntries((data.leaderboard || []).slice(0, limit));
                  setFromDate(data.from || null);
                }
              }).catch(err => console.error('Failed to refresh leaderboard:', err));
            }, 200);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes'
          },
          (payload: any) => {
            console.log('Leaderboard vote update:', payload);
            setTimeout(() => {
              let endpoint = "/api/leaderboard/weekly";
              if (activeTab === "alltime") endpoint = "/api/leaderboard/alltime";
              if (activeTab === "toprizz") endpoint = "/api/leaderboard/top-rizz";

              fetch(endpoint).then(res => res.json()).then(data => {
                if (data.leaderboard) {
                  setEntries((data.leaderboard || []).slice(0, limit));
                  setFromDate(data.from || null);
                }
              }).catch(err => console.error('Failed to refresh leaderboard:', err));
            }, 200);
          }
        )
        .subscribe((status: any) => {
          console.log('Leaderboard channel status:', status);
        });

      return () => {
        try {
          getSupabaseClient().removeChannel(leaderboardChannel);
        } catch (err) {
          console.error('Error removing leaderboard channel:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up real-time leaderboard subscription:', err);
      return () => {};
    }
  }, [activeTab, limit]);

  return (
    <div className={className}>
      {showTabs && (
        <nav className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeTab === "weekly" ? "bg-primary text-bg" : "bg-white text-primary"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab("alltime")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeTab === "alltime" ? "bg-primary text-bg" : "bg-white text-primary"
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setActiveTab("toprizz")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeTab === "toprizz" ? "bg-primary text-bg" : "bg-white text-primary"
            }`}
          >
            Top Rizz
          </button>
        </nav>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, idx) => (
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
        <div className="text-xs text-primary/70 text-center py-4">
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
                  votes={activeTab === "toprizz" ? undefined : e.votesCount}
                  miningRate={activeTab === "toprizz" ? e.miningRate : undefined}
                />
              </div>
              {activeTab === "toprizz" && e.currentRizz && (
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{e.currentRizz}</div>
                  <div className="text-xs text-primary/70">RIZZ</div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}