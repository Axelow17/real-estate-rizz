"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFarcasterUser } from "@/lib/useFarcasterUser";

export default function HomePage() {
  const { user, loading: userLoading, error } = useFarcasterUser();
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || userLoading) return;

    async function checkUser() {
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

        // Check if new user (just built house) and hasn't seen welcome
        const hasSeenWelcome = typeof window !== 'undefined' ? localStorage.getItem('hasSeenWelcome') : null;
        if (data.house.level === 1 && !data.house.last_claim && !hasSeenWelcome) {
          setIsNewUser(true);
        } else {
          // Not new user, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking user:', err);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-primary/70">Loading RealEstate Rizz</div>
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
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('hasSeenWelcome', 'true');
              }
              router.push('/dashboard');
            }}
            className="px-8 py-4 bg-primary text-bg font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition"
          >
            Enter Your House
          </button>
        </div>
      </main>
    );
  }

  // This should not be reached, but just in case
  return null;
}
