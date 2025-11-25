"use client";

import { useEffect, useState } from "react";
import { useFarcasterUser } from "@/lib/useFarcasterUser";

type CurrentStay = {
  id: number;
  host_fid: number;
  start_at: string;
  end_at: string | null;
  host?: { username: string } | null;
  house?: { level: number } | null;
};

export default function MyStayPage() {
  const { user, loading, error } = useFarcasterUser();
  const [stay, setStay] = useState<CurrentStay | null>(null);
  const [loadingStay, setLoadingStay] = useState(true);

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
      } finally {
        setLoadingStay(false);
      }
    }
    loadStay();
  }, [user, loading]);

  const handleStopStay = async () => {
    if (!user) return;
    const res = await fetch("/api/stay/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_fid: user.fid })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal menghentikan stay");
      return;
    }
    setStay(null);
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
      <header className="text-center">
        <h1 className="text-2xl font-bold">My Stay</h1>
        <p className="text-xs text-primary/70 mt-1">
          Your current stay status.
        </p>
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
        <section className="rounded-3xl bg-white shadow-md p-4 space-y-3 text-sm">
          <div>
            You are staying at{" "}
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
          <button
            onClick={handleStopStay}
            className="mt-3 py-2 rounded-full bg-accent text-white text-sm font-semibold w-full"
          >
            STOP STAY
          </button>
        </section>
      )}
    </main>
  );
}
