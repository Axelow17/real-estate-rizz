import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) return NextResponse.json({ error: "Missing fid" }, { status: 400 });

    const { data: house, error } = await supabaseServer
      .from("houses")
      .select("level, total_votes, rizz_point, mining_rate, last_tick, updated_at, created_at")
      .eq("fid", fid)
      .single();

    if (error || !house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Calculate current points server-side
    const now = new Date();
    const lastTick = new Date(house.last_tick);
    const hoursDiff = (now.getTime() - lastTick.getTime()) / (1000 * 60 * 60);
    const minedPoints = Math.max(0, Math.floor(hoursDiff * house.mining_rate));
    const current_points = house.rizz_point + minedPoints;

    return NextResponse.json({
      house: {
        ...house,
        current_points
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}