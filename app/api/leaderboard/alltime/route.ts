import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("votes")
      .select(
        `host_fid,
         players:players!votes_host_fid_fkey (username, pfp_url),
         houses:houses (level)`
      );
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load votes" },
        { status: 500 }
      );
    }
    const map = new Map<number, any>();
    (data || []).forEach((row: any) => {
      const key = row.host_fid;
      const existing = map.get(key);
      const username = row.players?.username || `fid:${row.host_fid}`;
      const pfp_url = row.players?.pfp_url;
      const level = row.houses?.level ?? 1;
      if (!existing) {
        map.set(key, {
          host_fid: key,
          username,
          pfp_url,
          level,
          votesCount: 1
        });
      } else {
        existing.votesCount += 1;
      }
    });
    const leaderboard = Array.from(map.values()).sort(
      (a, b) => b.votesCount - a.votesCount
    );
    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 50)
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}