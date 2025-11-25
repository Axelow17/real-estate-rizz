"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export type FarcasterUser = {
  fid: number;
  username: string;
  pfpUrl?: string;
};

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        let fid: number | null = null;
        let username: string | undefined;
        let pfpUrl: string | undefined;

        try {
          // No initialization needed - SDK is ready to use
          const context = await sdk.context;
          if (context.user?.fid) {
            fid = Number(context.user.fid);
            username = context.user.username;
            pfpUrl = context.user.pfpUrl;
          }
        } catch (err) {
          console.warn("FrameSDK not available, fallback demo", err);
          fid = 999999;
          username = "demo";
        }

        if (!fid || !username) {
          setError("Unable to detect Farcaster user");
          return;
        }

        setUser({ fid, username, pfpUrl });
      } catch (e: any) {
        setError(e?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  return { user, loading, error };
}
