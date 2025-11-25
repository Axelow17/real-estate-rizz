"use client";

import { useEffect, useMemo, useState } from "react";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { miningRate, staySplit } from "@/lib/economy";

type CurrentStay = {
  id: number;
  host_fid: number;
  start_at: string;
  end_at: string | null;
  host?: { username: string } | null;
  house?: { level: number } | null;
};

type HostHouse = {
  level: number;
  mining_rate: number;
};

export default function MyStayPage() {
  const { user, loading, error } = useFarcasterUser();
  const [stay, setStay] = useState<CurrentStay | null>(null);
  const [hostHouse, setHostHouse] = useState<HostHouse | null>(null);
  const [loadingStay, setLoadingStay] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  // Update time every second for live countdown
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    async function loadStay() {
      setLoadingStay(true);
      try {
        if (!user) return;
        const res = await fetch("/api/stay/current", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guest_fid: user.fid })
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(data);
          return;
        }
        setStay(data.stay || null);

        // If staying, load host house info for mining calculations
        if (data.stay) {
          const houseRes = await fetch("/api/house/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid: data.stay.host_fid })
          });
          const houseData = await houseRes.json();
          if (houseRes.ok && houseData.house) {
            setHostHouse({
              level: houseData.house.level,
              mining_rate: houseData.house.mining_rate
            });
          }
        }
      } finally {
        setLoadingStay(false);
      }
    }
    loadStay();
  }, [user, loading]);

  // Calculate stay duration and rewards
  const stayStats = useMemo(() => {
    if (!stay || !hostHouse) return null;

    const startTime = new Date(stay.start_at);
    const durationMs = now.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate potential reward (guest gets 80% of host's mining rate)
    const split = staySplit();
    const potentialReward = Math.floor(durationHours * hostHouse.mining_rate * split.guestShare);

    // Format duration
    const days = Math.floor(durationHours / 24);
    const hours = Math.floor(durationHours % 24);
    const minutes = Math.floor((durationHours % 1) * 60);
    const seconds = Math.floor(((durationHours % 1) * 60 % 1) * 60);

    return {
      duration: { days, hours, minutes, seconds },
      potentialReward,
      hostMiningRate: hostHouse.mining_rate,
      guestShare: split.guestShare
    };
  }, [stay, hostHouse, now]);

  const handleStopStay = async () => {
    if (!user) return;
    const res = await fetch("/api/stay/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_fid: user.fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to stop stay");
      return;
    }
    setStay(null);
    setHostHouse(null);
  };

  const handleClaimRewards = async () => {
    if (!user) return;
    const res = await fetch("/api/house/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid: user.fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Claim failed");
      return;
    }
    alert(`Successfully claimed rewards! Check your dashboard for updated RIZZ balance.`);
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading My Stay…</div>
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
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">My Stay</h1>
          <p className="text-xs text-primary/70 mt-1">
            Your current stay status and rewards.
          </p>
        </div>
      </header>

      {loadingStay ? (
        <div className="text-xs text-primary/70">Loading status…</div>
      ) : !stay ? (
        <section className="rounded-3xl bg-white shadow-md p-4 text-sm">
          <p>
            You are not staying at anyone's house.
            Go to <span className="font-semibold">Explore Houses</span> to
            choose accommodation.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {/* Stay Info */}
          <section className="rounded-3xl bg-white shadow-md p-4 space-y-3 text-sm">
            <div>
              Staying at{" "}
              <span className="font-semibold">
                @{stay.host?.username || stay.host_fid}
              </span>'s house
            </div>
            <div>House level: {stay.house?.level ?? "?"}</div>
            <div>
              Since:{" "}
              {new Date(stay.start_at).toLocaleString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short"
              })}
            </div>
          </section>

          {/* Stay Duration & Mining Progress */}
          {stayStats && (
            <section className="rounded-3xl bg-white shadow-md p-4 space-y-3">
              <h3 className="font-semibold text-primary">Stay Progress</h3>

              {/* Duration Counter */}
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {stayStats.duration.days > 0 && `${stayStats.duration.days}d `}
                  {stayStats.duration.hours.toString().padStart(2, '0')}:
                  {stayStats.duration.minutes.toString().padStart(2, '0')}:
                  {stayStats.duration.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-primary/70">Stay Duration</div>
              </div>

              {/* Mining Progress */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary">Mining Progress</div>
                <div className="text-xs text-primary/70">
                  Host mining rate: {stayStats.hostMiningRate} RIZZ/hour
                </div>
                <div className="text-xs text-primary/60">
                  Your share: {Math.floor(stayStats.hostMiningRate * stayStats.guestShare)} RIZZ/hour ({stayStats.guestShare * 100}% of host)
                </div>
                <div className="text-xs text-primary/60">
                  Potential reward: ~{stayStats.potentialReward} RIZZ
                </div>
                <div className="text-xs text-primary/50 mt-2">
                  Rewards accumulate automatically and can be claimed from your dashboard
                </div>
              </div>

              {/* Claim Button */}
              <div className="pt-2">
                <button
                  onClick={handleClaimRewards}
                  className="w-full py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
                >
                  CLAIM STAY REWARDS
                </button>
              </div>
            </section>
          )}

          {/* Stop Stay */}
          <section className="rounded-3xl bg-white shadow-md p-4">
            <button
              onClick={handleStopStay}
              className="w-full py-2 rounded-full bg-accent text-white text-sm font-semibold"
            >
              STOP STAY
            </button>
            <div className="text-xs text-primary/60 mt-2 text-center">
              This will end your stay and stop earning rewards
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
