"use client";

import { useFarcasterUser } from "@/lib/useFarcasterUser";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  const { user, loading, error } = useFarcasterUser();

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
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
      </header>

      <Leaderboard limit={50} showTabs={true} />

      {user && (
        <footer className="mt-2 text-center text-[11px] text-primary/60">
          Logged in as <span className="font-semibold">@{user.username}</span>
        </footer>
      )}
    </main>
  );
}
