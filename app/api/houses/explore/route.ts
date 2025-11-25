import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { mode = "popular", excludeFid } = await req.json();
    let query = supabaseServer
      .from("houses")
      .select(
        `fid, level, total_votes, players:players!inner (username, pfp_url)`
      );
    if (excludeFid) {
      query = query.neq("fid", excludeFid);
    }
    if (mode === "popular") {
      query = query.order("total_votes", { ascending: false });
    } else if (mode === "level") {
      query = query.order("level", { ascending: false });
    } else if (mode === "trending") {
      // For trending, we need to calculate recent votes, but for simplicity, use total_votes for now
      query = query.order("total_votes", { ascending: false });
    } else if (mode === "followers") {
      // For followers, sort by fid as proxy (higher fid might have more followers, but inaccurate)
      query = query.order("fid", { ascending: false });
    }
    const { data, error } = await query.limit(30);
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch houses" },
        { status: 500 }
      );
    }
    return NextResponse.json({ houses: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
