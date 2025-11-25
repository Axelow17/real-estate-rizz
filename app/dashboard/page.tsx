"use client";

import { useEffect, useMemo, useState } from "react";
import { RizzHeader } from "@/components/RizzHeader";
import { HouseMainCard } from "@/components/HouseMainCard";
import Leaderboard from "@/components/Leaderboard";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { miningRate, nextUpgradeCost } from "@/lib/economy";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { sdk } from "@farcaster/miniapp-sdk";

type HouseState = {
  level: number;
  rizz_point: number;
  mining_rate: number;
  last_tick: string;
  current_points?: number;
  updated_at?: string;
  created_at?: string;
};

type Guest = {
  guest_fid: number;
  username: string;
  start_at: string;
};

type CurrentStay = {
  host_fid: number;
  host_username: string;
  start_at: string;
};

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  action: 'vote' | 'stay';
  targetUsername: string;
  targetFid: number;
};

export default function DashboardPage() {
  const { user, loading: userLoading, error } = useFarcasterUser();
  const [house, setHouse] = useState<HouseState | null>(null);
  const [loadingHouse, setLoadingHouse] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [currentStay, setCurrentStay] = useState<CurrentStay | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [shareModal, setShareModal] = useState<ShareModalProps>({ isOpen: false, onClose: () => {}, action: 'vote', targetUsername: '', targetFid: 0 });
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, newLevel: 0 });
  const [now, setNow] = useState<Date>(new Date());
  const [miningProgress, setMiningProgress] = useState<{ earned: number; timeRemaining: number; percentage: number }>({
    earned: 0,
    timeRemaining: 0,
    percentage: 0
  });

  // Format time remaining as HH:MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 2000);
    return () => clearInterval(id);
  }, []);

  // Load cached data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedHouse = localStorage.getItem('dashboard_house');
      const cachedGuests = localStorage.getItem('dashboard_guests');
      const cachedStay = localStorage.getItem('dashboard_stay');

      if (cachedHouse) {
        try {
          setHouse(JSON.parse(cachedHouse));
        } catch (e) {
          console.warn('Failed to parse cached house data');
        }
      }

      if (cachedGuests) {
        try {
          setGuests(JSON.parse(cachedGuests));
        } catch (e) {
          console.warn('Failed to parse cached guests data');
        }
      }

      if (cachedStay) {
        try {
          setCurrentStay(JSON.parse(cachedStay));
        } catch (e) {
          console.warn('Failed to parse cached stay data');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!user || userLoading) return;
    async function fetchInit() {
      setLoadingHouse(true);
      try {
        if (!user) return;
        const res = await fetch("/api/user/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: user.fid,
            username: user.username,
            pfpUrl: user.pfpUrl
          })
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("init error", data);
          return;
        }
        const houseData = {
          level: data.house.level,
          rizz_point: data.house.rizz_point,
          mining_rate: data.house.mining_rate,
          last_tick: data.house.last_tick,
          current_points: data.house.current_points,
          updated_at: data.house.updated_at,
          created_at: data.house.created_at
        };
        setHouse(houseData);

        // Cache house data
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_house', JSON.stringify(houseData));
        }

        // Check if new user (just built house)
        if (data.house.level === 1 && !data.house.last_claim) {
          setIsNewUser(true);
          setShowShareBanner(true);
        }
      } finally {
        setLoadingHouse(false);
      }
    }
    fetchInit();
  }, [user, userLoading]);

  // Polling for real-time updates (guests, current stay, and house data)
  useEffect(() => {
    if (!user || userLoading) return;

    const fetchGuests = async () => {
      const guestsRes = await fetch("/api/stay/my-guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_fid: user.fid })
      });
      const guestsData = await guestsRes.json();
      if (guestsRes.ok) {
        const guests = guestsData.guests || [];
        setGuests(guests);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_guests', JSON.stringify(guests));
        }
      }
    };

    const fetchCurrentStay = async () => {
      const stayRes = await fetch("/api/stay/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_fid: user.fid })
      });
      const stayData = await stayRes.json();
      if (stayRes.ok && stayData.stay) {
        const stay = {
          host_fid: stayData.stay.host_fid,
          host_username: stayData.stay.host?.username || `fid:${stayData.stay.host_fid}`,
          start_at: stayData.stay.start_at
        };
        setCurrentStay(stay);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_stay', JSON.stringify(stay));
        }
      } else {
        setCurrentStay(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dashboard_stay');
        }
      }
    };

    const fetchHouseData = async () => {
      const houseRes = await fetch("/api/house/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: user.fid })
      });
      const houseData = await houseRes.json();
      if (houseRes.ok && houseData.house) {
        const house = {
          level: houseData.house.level,
          rizz_point: houseData.house.rizz_point,
          mining_rate: houseData.house.mining_rate,
          last_tick: houseData.house.last_tick,
          current_points: houseData.house.current_points,
          updated_at: houseData.house.updated_at,
          created_at: houseData.house.created_at
        };
        setHouse(house);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_house', JSON.stringify(house));
        }
      }
    };

    // Initial fetch after main data
    const timer = setTimeout(() => {
      fetchGuests();
      fetchCurrentStay();
      fetchHouseData();
    }, 1000); // Delay 1s after init

    // Polling every 10 seconds for better real-time feel
    const interval = setInterval(() => {
      fetchGuests();
      fetchCurrentStay();
      fetchHouseData();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [user, userLoading]);

  // Real-time subscriptions for instant updates
  useEffect(() => {
    if (!user || userLoading || typeof window === 'undefined') return;

    try {
      // Subscribe to house updates
      const houseChannel = getSupabaseClient()
        .channel('house-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'houses',
            filter: `fid=eq.${user.fid}`
          },
          (payload: any) => {
            console.log('House update:', payload);
            if (payload.new) {
              const updatedHouse = {
                level: payload.new.level,
                rizz_point: payload.new.rizz_point,
                mining_rate: payload.new.mining_rate,
                last_tick: payload.new.last_tick,
                updated_at: payload.new.updated_at,
                created_at: payload.new.created_at
              };
              setHouse(updatedHouse);
              localStorage.setItem('dashboard_house', JSON.stringify(updatedHouse));
            }
          }
        )
        .subscribe((status: any) => {
          console.log('House channel status:', status);
        });

      // Subscribe to stays updates (for guests and current stay)
      const staysChannel = getSupabaseClient()
        .channel('stays-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stays'
          },
          (payload: any) => {
            console.log('Stays update:', payload);
            // Refresh guests and current stay data
            if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
              // Trigger a refresh of guests and stay data
              setTimeout(() => {
                fetch("/api/stay/my-guests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ host_fid: user.fid })
                }).then(res => res.json()).then(data => {
                  if (data.guests) {
                    setGuests(data.guests);
                    localStorage.setItem('dashboard_guests', JSON.stringify(data.guests));
                  }
                }).catch(err => console.error('Failed to refresh guests:', err));

                fetch("/api/stay/current", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ guest_fid: user.fid })
                }).then(res => res.json()).then(data => {
                  if (data.stay) {
                    const stay = {
                      host_fid: data.stay.host_fid,
                      host_username: data.stay.host?.username || `fid:${data.stay.host_fid}`,
                      start_at: data.stay.start_at
                    };
                    setCurrentStay(stay);
                    localStorage.setItem('dashboard_stay', JSON.stringify(stay));
                  } else {
                    setCurrentStay(null);
                    localStorage.removeItem('dashboard_stay');
                  }
                }).catch(err => console.error('Failed to refresh current stay:', err));
              }, 500); // Small delay to ensure DB consistency
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Stays channel status:', status);
        });

      // Subscribe to votes updates (for vote counts)
      const votesChannel = getSupabaseClient()
        .channel('votes-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes'
          },
          (payload: any) => {
            console.log('Votes update:', payload);
            // Refresh house data when votes change
            if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
              setTimeout(() => {
                fetch("/api/house/info", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fid: user.fid })
                }).then(res => res.json()).then(data => {
                  if (data.house) {
                    const updatedHouse = {
                      level: data.house.level,
                      rizz_point: data.house.rizz_point,
                      mining_rate: data.house.mining_rate,
                      last_tick: data.house.last_tick,
                      current_points: data.house.rizz_point,
                      updated_at: data.house.updated_at,
                      created_at: data.house.created_at
                    };
                    setHouse(updatedHouse);
                    localStorage.setItem('dashboard_house', JSON.stringify(updatedHouse));
                  }
                }).catch(err => console.error('Failed to refresh house after vote:', err));
              }, 300);
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Votes channel status:', status);
        });

      return () => {
        try {
          getSupabaseClient().removeChannel(houseChannel);
          getSupabaseClient().removeChannel(staysChannel);
          getSupabaseClient().removeChannel(votesChannel);
        } catch (err) {
          console.error('Error removing channels:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up real-time subscriptions:', err);
      // Continue without real-time if it fails
      return () => {};
    }
  }, [user, userLoading]);

  // Real-time mining progress updates
  useEffect(() => {
    if (!house) return;

    const updateMiningProgress = () => {
      const now = new Date();
      const lastTick = new Date(house.last_tick);
      const hoursDiff = (now.getTime() - lastTick.getTime()) / (1000 * 60 * 60);

      // Calculate earned points since last tick
      const earned = Math.max(0, Math.floor(hoursDiff * house.mining_rate));

      // Update house current_points for real-time display
      const currentPoints = house.rizz_point + earned;
      setHouse(prev => prev ? { ...prev, current_points: currentPoints } : null);

      // Assume claim threshold is 10 RIZZ (you can adjust this)
      const claimThreshold = 10;
      const percentage = Math.min(100, (earned / claimThreshold) * 100);

      // Time remaining until next claim (in seconds)
      const remainingPoints = Math.max(0, claimThreshold - earned);
      const timeRemaining = Math.max(0, (remainingPoints / house.mining_rate) * 3600);

      setMiningProgress({
        earned: earned / 100, // Convert to RIZZ (assuming 100 points = 1 RIZZ)
        timeRemaining,
        percentage
      });
    };

    // Update immediately
    updateMiningProgress();

    // Update every second for real-time display
    const interval = setInterval(updateMiningProgress, 1000);

    return () => clearInterval(interval);
  }, [house]);

  const displayRizz = useMemo(() => {
    if (!house) return 0;
    // Use current_points calculated server-side
    return house.current_points || house.rizz_point || 0;
  }, [house]);

  const handleClaim = async () => {
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
    const updatedHouse = {
      level: data.house.level,
      rizz_point: data.house.rizz_point,
      mining_rate: data.house.mining_rate,
      last_tick: data.house.last_tick,
      current_points: data.house.rizz_point, // After claim, current = base
      updated_at: data.house.updated_at,
      created_at: data.house.created_at
    };
    setHouse(updatedHouse);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_house', JSON.stringify(updatedHouse));
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    const res = await fetch("/api/house/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid: user.fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Upgrade failed");
      return;
    }
    const updatedHouse = {
      level: data.house.level,
      rizz_point: data.house.rizz_point,
      mining_rate: data.house.mining_rate,
      last_tick: data.house.last_tick,
      current_points: data.house.rizz_point, // After upgrade, current = base
      updated_at: data.house.updated_at,
      created_at: data.house.created_at
    };
    setHouse(updatedHouse);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_house', JSON.stringify(updatedHouse));
    }
    // Open upgrade modal
    setUpgradeModal({ isOpen: true, newLevel: data.house.level });
  };

  const handleExplore = () => {
    window.location.href = "/explore";
  };

  const handleMyStay = () => {
    window.location.href = "/my-stay";
  };

  const handleVotePreview = () => {
    window.location.href = "/explore";
  };

  if (userLoading || loadingHouse || !house || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading RealEstate Rizz…</div>
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

  if (isNewUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-bg">
        <div className="text-center space-y-6 p-6">
          <h1 className="text-3xl font-bold text-primary">Welcome to RealEstate Rizz!</h1>
          <p className="text-lg text-primary/70">Your house is ready. Start building your empire!</p>
          <button
            onClick={() => setIsNewUser(false)}
            className="px-8 py-4 bg-primary text-bg font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition"
          >
            Enter Your House
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5">
      <RizzHeader username={user.username} rizzPoint={displayRizz} pfpUrl={user.pfpUrl} />
      <HouseMainCard level={house.level} />

      {/* Mining Status */}
      <section className="rounded-3xl bg-white shadow-md p-4 text-center">
        <div className="text-sm font-semibold text-primary">Mining Status</div>
        <div className="text-xs text-primary/70 mt-1">
          Mining rate: {house.mining_rate} RIZZ/hour
        </div>
        <div className="text-xs text-primary/60 mt-1">
          Next claim: {formatTimeRemaining(miningProgress.timeRemaining)}
        </div>
        <div className="text-xs text-primary/60 mt-1">
          Earned: ~{miningProgress.earned.toFixed(2)} RIZZ
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-accent h-2 rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${miningProgress.percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-primary/50 mt-1">
            {miningProgress.percentage.toFixed(1)}% to claim
          </div>
        </div>
        <div className="text-xs text-primary/50 mt-2">
          Points accumulate automatically
        </div>
        <div className="text-xs text-primary/50 mt-1">
          Current: {displayRizz} RIZZ
        </div>
        <div className="mt-2">
          <button
            onClick={handleClaim}
            disabled={miningProgress.percentage < 100}
            className={`w-full py-2 rounded-full font-semibold text-sm shadow-md ${
              miningProgress.percentage >= 100
                ? 'bg-primary text-bg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            CLAIM ALL
          </button>
        </div>
      </section>

      {showShareBanner && (
        <section className="rounded-3xl bg-accent/10 border border-accent p-4 text-center">
          <h3 className="font-semibold text-accent">🎉 House Built! Share Your Home</h3>
          <p className="text-sm text-primary/70 mb-3">Let friends know about your new house!</p>
          <button
            onClick={async () => {
              // Share logic
              const shareUrl = `https://real-estate-rizz.vercel.app/api/share/embed?action=built&username=${encodeURIComponent(user.username)}`;
              const text = `Check out my new house in RealEstate Rizz! ${shareUrl}`;
              try {
                await sdk.actions.composeCast({ text });
              } catch (err) {
                console.warn("Failed to compose cast", err);
                // Fallback to manual share
                window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
              }
              setShowShareBanner(false);
            }}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-full"
          >
            Share Now
          </button>
        </section>
      )}

      <section className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleUpgrade}
            disabled={displayRizz < nextUpgradeCost(house.level)}
            className={`w-full py-2 rounded-full font-semibold text-sm shadow-md ${
              displayRizz >= nextUpgradeCost(house.level)
                ? 'bg-accent text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            UPGRADE ({nextUpgradeCost(house.level)} RIZZ)
          </button>
          <button
            onClick={handleExplore}
            className="w-full py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
          >
            EXPLORE HOUSES
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleMyStay}
            className="w-full py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
          >
            MY STAY
          </button>
        </div>
      </section>
      <section className="mt-4 flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-primary">
          EXPLORE HOUSES
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52">
            <img
              src="/houses/level10.png"
              alt="Other house preview"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <button
            onClick={handleVotePreview}
            className="mt-3 px-10 py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
          >
            VOTE
          </button>
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-primary">
          Stay Network
        </div>
        {currentStay && (
          <div className="rounded-3xl bg-white shadow-md p-4">
            <h3 className="font-semibold">My Current Stay</h3>
            <p className="text-sm">Staying at @{currentStay.host_username} since {new Date(currentStay.start_at).toLocaleDateString()}</p>
            <button
              onClick={() => window.location.href = "/my-stay"}
              className="mt-2 px-4 py-1 rounded-full bg-primary text-bg text-xs font-semibold"
            >
              Manage Stay
            </button>
          </div>
        )}
        {guests.length > 0 && (
          <div className="rounded-3xl bg-white shadow-md p-4">
            <h3 className="font-semibold">My Guests ({guests.length})</h3>
            <div className="space-y-2 mt-2">
              {guests.slice(0, 3).map((g) => (
                <div key={g.guest_fid} className="text-sm">
                  @{g.username} since {new Date(g.start_at).toLocaleDateString()}
                </div>
              ))}
              {guests.length > 3 && <div className="text-xs text-primary/60">+{guests.length - 3} more</div>}
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-primary">
          LEADERBOARD
        </div>
        <Leaderboard limit={3} showTabs={false} defaultTab="weekly" />
        <button
          onClick={() => window.location.href = "/leaderboard"}
          className="mt-2 px-4 py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
        >
          VIEW FULL LEADERBOARD
        </button>
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
                onClick={() => {
                  const shareUrl = `https://real-estate-rizz.vercel.app/api/share/embed?action=voted&username=${encodeURIComponent(user.username)}&targetUsername=${encodeURIComponent(shareModal.targetUsername)}`;
                  const text = `I just ${shareModal.action}d @${shareModal.targetUsername}'s house in RealEstate Rizz! ${shareUrl} 🏠❤️`;
                  window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
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

      {/* Upgrade Modal */}
      {upgradeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 text-center space-y-4">
            <h3 className="font-semibold text-lg">🏠 House Upgraded!</h3>
            <p className="text-sm text-primary/70">
              Congratulations! Your house is now level {upgradeModal.newLevel}. Share your progress!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUpgradeModal({ isOpen: false, newLevel: 0 })}
                className="flex-1 py-2 border border-primary text-primary rounded-full"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  const shareUrl = `https://real-estate-rizz.vercel.app/api/share/embed?action=upgraded&username=${encodeURIComponent(user.username)}&level=${upgradeModal.newLevel}`;
                  const text = `Just upgraded my house to level ${upgradeModal.newLevel} in RealEstate Rizz! ${shareUrl}`;
                  try {
                    await sdk.actions.composeCast({ text });
                  } catch (err) {
                    console.warn("Failed to compose cast", err);
                    // Fallback to manual share
                    window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
                  }
                  setUpgradeModal({ isOpen: false, newLevel: 0 });
                }}
                className="flex-1 py-2 bg-accent text-white rounded-full font-semibold"
              >
                Share Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
