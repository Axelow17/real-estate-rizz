"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { HouseMainCard } from "@/components/HouseMainCard";
import { neynarClient } from "@/lib/neynar";

type ProfileData = {
  player: {
    fid: number;
    username: string;
    pfp_url?: string;
    bio?: string;
    followers?: number;
  };
  house: {
    level: number;
    total_votes: number;
  };
  currentStay?: {
    id: number;
    start_at: string;
  } | null;
  guests: number;
};

export default function ProfilePage() {
  const { fid } = useParams() as { fid: string };
  const { user } = useFarcasterUser();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const targetFid = parseInt(fid);
        if (!targetFid) throw new Error("Invalid FID");

        // Fetch from Neynar
        const neynarResp = await neynarClient.fetchBulkUsers({ fids: [targetFid] });
        const neynarUser = neynarResp.users[0];
        if (!neynarUser) throw new Error("User not found on Neynar");

        // Fetch house
        const houseRes = await fetch("/api/house/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: targetFid })
        });
        const houseData = await houseRes.json();
        if (!houseRes.ok) throw new Error(houseData.error);

        // Current stay (if user is guest)
        let currentStay = null;
        if (user) {
          const stayRes = await fetch("/api/stay/current", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guest_fid: user.fid })
          });
          const stayData = await stayRes.json();
          if (stayRes.ok && stayData.stay && stayData.stay.host_fid === targetFid) {
            currentStay = stayData.stay;
          }
        }

        // Guests count
        const guestsRes = await fetch("/api/stay/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ host_fid: targetFid })
        });
        const guestsData = await guestsRes.json();

        setData({
          player: {
            fid: targetFid,
            username: neynarUser.username,
            pfp_url: neynarUser.pfp_url,
            bio: neynarUser.profile?.bio?.text,
            followers: neynarUser.follower_count
          },
          house: houseData.house,
          currentStay,
          guests: guestsData.count || 0
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [fid, user]);

  const handleStay = async () => {
    if (!user || !data) return;
    const res = await fetch("/api/stay/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_fid: user.fid, host_fid: data.player.fid })
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error);
      return;
    }
    alert("You are now staying here!");
    window.location.reload();
  };

  const handleStopStay = async () => {
    if (!user) return;
    const res = await fetch("/api/stay/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_fid: user.fid })
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error);
      return;
    }
    alert("Stay stopped!");
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading profile…</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-red-500">{error || "Profile not found"}</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <header className="text-center">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-2 flex items-center justify-center">
          <span className="text-bg font-bold text-xl">
            {data.player.username.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <h1 className="text-xl font-bold">@{data.player.username}</h1>
        {data.player.bio && <p className="text-sm text-primary/70 mt-1">{data.player.bio}</p>}
        <p className="text-xs text-primary/60">Followers: {data.player.followers || 0}</p>
      </header>

      <HouseMainCard level={data.house.level} />

      <section className="rounded-3xl bg-white shadow-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">House Stats</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold">Level</div>
            <div>{data.house.level}</div>
          </div>
          <div>
            <div className="font-semibold">Total Votes</div>
            <div>{data.house.total_votes}</div>
          </div>
          <div>
            <div className="font-semibold">Current Guests</div>
            <div>{data.guests}</div>
          </div>
        </div>
      </section>

      <section className="flex gap-3">
        {data.currentStay ? (
          <button
            onClick={handleStopStay}
            className="flex-1 py-3 rounded-full bg-accent text-white font-semibold"
          >
            STOP STAY
          </button>
        ) : (
          <button
            onClick={handleStay}
            className="flex-1 py-3 rounded-full bg-primary text-bg font-semibold"
          >
            STAY
          </button>
        )}
      </section>
    </main>
  );
}