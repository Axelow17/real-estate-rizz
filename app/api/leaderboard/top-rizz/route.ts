import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("houses")
      .select(
        `fid,
         level,
         base_rizz,
         mining_rate,
         last_tick,
         total_votes,
         players:players (username, pfp_url)`
      )
      .order("base_rizz", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load houses" },
        { status: 500 }
      );
    }

    const now = new Date();
    const leaderboard = (data || []).map((row: any) => {
      // Calculate current rizz points (base + mined since last_tick)
      const lastTick = new Date(row.last_tick);
      const hoursDiff = (now.getTime() - lastTick.getTime()) / (1000 * 60 * 60);
      const minedPoints = Math.max(0, Math.floor(hoursDiff * row.mining_rate));
      const currentRizz = row.base_rizz + minedPoints;

      return {
        host_fid: row.fid,
        username: row.players?.username || `fid:${row.fid}`,
        pfp_url: row.players?.pfp_url,
        level: row.level,
        currentRizz: currentRizz,
        baseRizz: row.base_rizz,
        miningRate: row.mining_rate,
        votesCount: row.total_votes
      };
    });

    // Sort by current rizz points (already mostly sorted by base_rizz, but ensure proper ordering)
    leaderboard.sort((a, b) => b.currentRizz - a.currentRizz);

    return NextResponse.json({
      leaderboard
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}