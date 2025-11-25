"use client";

import { useEffect, useState } from "react";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { RizzHeader } from "@/components/RizzHeader";
import { HouseMainCard } from "@/components/HouseMainCard";

type MyProfileData = {
  player: {
    username: string;
    pfp_url?: string;
  };
  house: {
    level: number;
    rizz_point: number;
    total_votes: number;
  };
  stats: {
    totalVotesGiven: number;
    totalStays: number;
    currentGuests: number;
  };
};

export default function MyProfilePage() {
  const { user, loading, error } = useFarcasterUser();
  const [data, setData] = useState<MyProfileData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user || loading) return;
    async function fetchProfile() {
      setLoadingData(true);
      try {
        if (!user) return;
        const res = await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: user.fid })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchProfile();
  }, [user, loading]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading profile…</div>
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
    <main className="flex flex-col gap-4">
      <header className="relative">
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="absolute left-0 top-0 p-2 text-primary/70 hover:text-primary"
        >
          ← Back
        </button>
      </header>
      <RizzHeader username={user.username} rizzPoint={data?.house.rizz_point || 0} pfpUrl={user.pfpUrl} />
      <HouseMainCard level={data?.house.level || 1} />

      <section className="rounded-3xl bg-white shadow-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">My Stats</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold">Level</div>
            <div>{data?.house.level || 1}</div>
          </div>
          <div>
            <div className="font-semibold">Total Votes Received</div>
            <div>{data?.house.total_votes || 0}</div>
          </div>
          <div>
            <div className="font-semibold">Rizz Points</div>
            <div>{data?.house.rizz_point || 0}</div>
          </div>
          <div>
            <div className="font-semibold">Current Guests</div>
            <div>{data?.stats.currentGuests || 0}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white shadow-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="text-sm text-primary/70">
          Total Votes Given: {data?.stats.totalVotesGiven || 0}<br />
          Total Stays: {data?.stats.totalStays || 0}
        </div>
      </section>
    </main>
  );
}