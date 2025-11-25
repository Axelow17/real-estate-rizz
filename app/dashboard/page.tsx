"use client";

import { useEffect, useMemo, useState } from "react";
import { RizzHeader } from "@/components/RizzHeader";
import { HouseMainCard } from "@/components/HouseMainCard";
import { useFarcasterUser } from "@/lib/useFarcasterUser";
import { miningRate, nextUpgradeCost } from "@/lib/economy";
import { getSupabaseClient } from "@/lib/supabaseClient";

type HouseState = {
  level: number;
  rizz_point: number;
  last_claim: string;
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
          last_claim: data.house.last_claim
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
          last_claim: houseData.house.last_claim
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
                last_claim: payload.new.last_claim,
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

      return () => {
        try {
          getSupabaseClient().removeChannel(houseChannel);
          getSupabaseClient().removeChannel(staysChannel);
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

  const displayRizz = useMemo(() => {
    if (!house) return 0;
    const base = house.rizz_point;
    const lastClaim = new Date(house.last_claim);
    const hours = (now.getTime() - lastClaim.getTime()) / 3_600_000;
    const rate = miningRate(house.level);
    const mined = Math.max(0, Math.floor(hours * rate));
    return base + mined;
  }, [house, now]);

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
      last_claim: data.house.last_claim
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
      last_claim: data.house.last_claim
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
          Mining rate: {miningRate(house.level)} RIZZ/hour
        </div>
        <div className="text-xs text-primary/60 mt-1">
          Next claim: {(() => {
            const remainingMs = 3600000 - (now.getTime() - new Date(house.last_claim || house.updated_at || house.created_at || new Date()).getTime());
            const hours = Math.floor(Math.max(0, remainingMs) / 3600000);
            const minutes = Math.floor((Math.max(0, remainingMs) % 3600000) / 60000);
            const seconds = Math.floor((Math.max(0, remainingMs) % 60000) / 1000);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          })()}
        </div>
        <div className="text-xs text-primary/50 mt-1">
          Earned: ~{(() => {
            const elapsedMs = now.getTime() - new Date(house.last_claim || house.updated_at || house.created_at || new Date()).getTime();
            const elapsedHours = Math.max(0, elapsedMs) / 3600000;
            return (miningRate(house.level) * elapsedHours).toFixed(2);
          })()} RIZZ
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, Math.max(0, ((now.getTime() - new Date(house.last_claim || house.updated_at || house.created_at || new Date()).getTime()) / 3600000) * 100))}%`
              }}
            ></div>
          </div>
          <div className="text-xs text-primary/50 mt-1">
            {Math.min(100, Math.max(0, ((now.getTime() - new Date(house.last_claim || house.updated_at || house.created_at || new Date()).getTime()) / 3600000) * 100)).toFixed(1)}% to claim
          </div>
        </div>
      </section>

      {showShareBanner && (
        <section className="rounded-3xl bg-accent/10 border border-accent p-4 text-center">
          <h3 className="font-semibold text-accent">🎉 House Built! Share Your Home</h3>
          <p className="text-sm text-primary/70 mb-3">Let friends know about your new house!</p>
          <button
            onClick={() => {
              // Share logic
              const text = `Check out my new house in RealEstate Rizz! 🏠 #RealEstateRizz`;
              window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
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
            onClick={handleClaim}
            className="w-full py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
          >
            CLAIM
          </button>
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExplore}
            className="w-full py-2 rounded-full bg-primary text-bg font-semibold text-sm shadow-md"
          >
            EXPLORE HOUSES
          </button>
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
                  const text = `I just ${shareModal.action}d @${shareModal.targetUsername}'s house in RealEstate Rizz! Who's next? 🏠❤️`;
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
                onClick={() => {
                  const text = `Just upgraded my house to level ${upgradeModal.newLevel} in RealEstate Rizz! 🏠💪 #RealEstateRizz`;
                  window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, '_blank');
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
