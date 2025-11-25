import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("houses")
      .select(
        `fid,
         level,
         total_votes,
         players:players (username, pfp_url)`
      )
      .order("level", { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load houses" },
        { status: 500 }
      );
    }
    const leaderboard = (data || []).map((row: any) => ({
      host_fid: row.fid,
      username: row.players?.username || `fid:${row.fid}`,
      pfp_url: row.players?.pfp_url,
      level: row.level,
      votesCount: row.total_votes
    }));
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