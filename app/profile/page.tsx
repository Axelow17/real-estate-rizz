"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFarcasterUser } from "@/lib/useFarcasterUser";

export default function ProfileRedirectPage() {
  const { user, loading } = useFarcasterUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/profile/${user.fid}`);
    } else if (!loading && !user) {
      // If no user, maybe redirect to home or login
      router.replace("/");
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-primary/70">Loading profile...</p>
      </div>
    </div>
  );
}