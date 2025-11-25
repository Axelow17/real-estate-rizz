"use client";

import { useEffect, useState } from "react";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { HouseCard } from "@/components/HouseCard";
import { miningRate } from "@/lib/economy";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { sdk } from "@farcaster/miniapp-sdk";

type ExploreHouse = {
  fid: number;
  level: number;
  total_votes: number;
  players?: {
    username: string;
    pfp_url?: string;
  } | null;
};

export default function ExplorePage() {
  const { user, loading, error } = useFarcasterUser();
  const [houses, setHouses] = useState<ExploreHouse[]>([]);
  const [mode, setMode] = useState<"popular" | "level" | "followers" | "trending">("popular");
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [shareModal, setShareModal] = useState({ isOpen: false, onClose: () => {}, action: 'vote' as 'vote' | 'stay', targetUsername: '', targetFid: 0 });

  useEffect(() => {
    if (!user || loading) return;
    async function load() {
      setLoadingHouses(true);
      try {
        if (!user) return;
        const res = await fetch("/api/houses/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, excludeFid: user.fid })
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(data);
          return;
        }
        setHouses(data.houses || []);
      } finally {
        setLoadingHouses(false);
      }
    }
    load();
  }, [user, loading, mode]);

  // Real-time subscription for houses updates
  useEffect(() => {
    if (!user || loading || typeof window === 'undefined') return;

    try {
      const housesChannel = getSupabaseClient()
        .channel('explore-houses-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'houses'
          },
          (payload: any) => {
            console.log('Explore house update:', payload);
            if (payload.new) {
              // Refresh the houses list when any house is updated
              setTimeout(() => {
                fetch("/api/houses/explore", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mode, excludeFid: user.fid })
                }).then(res => res.json()).then(data => {
                  if (data.houses) {
                    setHouses(data.houses);
                  }
                }).catch(err => console.error('Failed to refresh houses:', err));
              }, 200);
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Explore houses channel status:', status);
        });

      return () => {
        try {
          getSupabaseClient().removeChannel(housesChannel);
        } catch (err) {
          console.error('Error removing houses channel:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up real-time houses subscription:', err);
      return () => {};
    }
  }, [user, loading, mode]);

  const handleVote = async (host_fid: number, targetUsername: string) => {
    if (!user) return;
    const res = await fetch("/api/house/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_fid: user.fid, host_fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Vote failed");
      return;
    }
    setHouses(prev =>
      prev.map(h => h.fid === host_fid ? { ...h, total_votes: (h.total_votes || 0) + 1 } : h)
    );
    // Open share modal
    setShareModal({
      isOpen: true,
      onClose: () => setShareModal({ ...shareModal, isOpen: false }),
      action: 'vote',
      targetUsername,
      targetFid: host_fid
    });
  };

  const handleStay = async (host_fid: number, targetUsername: string) => {
    if (!user) return;
    const res = await fetch("/api/stay/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_fid: user.fid, host_fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to start stay");
      return;
    }
    alert("You are now staying at this house!");
    // Open share modal
    setShareModal({
      isOpen: true,
      onClose: () => setShareModal({ ...shareModal, isOpen: false }),
      action: 'stay',
      targetUsername,
      targetFid: host_fid
    });
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading explore…</div>
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
        <div className="text-center">
          <h1 className="text-2xl font-bold">Explore Houses</h1>
          <p className="text-xs text-primary/70 mt-1">
            Vote and stay at other players' houses.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => setMode("popular")}
          className={`py-1.5 rounded-full border ${
            mode === "popular"
              ? "bg-primary text-bg border-primary"
              : "border-primary/30 text-primary/70"
          }`}
        >
          Popular
        </button>
        <button
          onClick={() => setMode("level")}
          className={`py-1.5 rounded-full border ${
            mode === "level"
              ? "bg-primary text-bg border-primary"
              : "border-primary/30 text-primary/70"
          }`}
        >
          Highest Level
        </button>
        <button
          onClick={() => setMode("followers")}
          className={`py-1.5 rounded-full border ${
            mode === "followers"
              ? "bg-primary text-bg border-primary"
              : "border-primary/30 text-primary/70"
          }`}
        >
          By Followers
        </button>
        <button
          onClick={() => setMode("trending")}
          className={`py-1.5 rounded-full border ${
            mode === "trending"
              ? "bg-primary text-bg border-primary"
              : "border-primary/30 text-primary/70"
          }`}
        >
          Trending
        </button>
      </div>

      {loadingHouses && (
        <div className="text-xs text-primary/70">Loading houses…</div>
      )}

      <section className="space-y-4 pb-6">
        {houses.map(h => (
          <div key={h.fid} className="space-y-2">
            <HouseCard
              fid={h.fid}
              level={h.level}
              ownerName={h.players?.username}
              pfpUrl={h.players?.pfp_url}
              votes={h.total_votes}
              miningRate={miningRate(h.level)}
              onVote={() => handleVote(h.fid, h.players?.username || `fid:${h.fid}`)}
              onStay={() => handleStay(h.fid, h.players?.username || `fid:${h.fid}`)}
            />
          </div>
        ))}
        {!loadingHouses && houses.length === 0 && (
          <div className="text-xs text-primary/60">
            No other houses registered yet.
          </div>
        )}
      </section>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 text-center space-y-4">
            <h3 className="font-semibold text-lg">Share This Action!</h3>
            <p className="text-sm text-primary/70">
              You just {shareModal.action}d @{shareModal.targetUsername}'s house. Share it!
            </p>
            <div className="flex gap-3">
              <button
                onClick={shareModal.onClose}
                className="flex-1 py-2 border border-primary text-primary rounded-full"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  const shareUrl = `https://real-estate-rizz.vercel.app/api/share/embed?action=${shareModal.action === 'vote' ? 'voted' : 'stayed'}&username=${encodeURIComponent(user.username)}&targetUsername=${encodeURIComponent(shareModal.targetUsername)}`;
                  const actionText = shareModal.action === 'vote' ? 'voted' : 'stayed';
                  const text = `I just ${actionText} @${shareModal.targetUsername}'s house in RealEstate Rizz! ${shareUrl}`;
                  try {
                    await sdk.actions.composeCast({ text });
                  } catch (err) {
                    console.warn("Failed to compose cast", err);
                    // Fallback to manual share
                    window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
                  }
                  shareModal.onClose();
                }}
                className="flex-1 py-2 bg-primary text-bg rounded-full font-semibold"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
