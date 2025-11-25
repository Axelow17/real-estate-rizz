import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const { data: house, error: houseErr } = await supabaseServer
      .from("houses")
      .select("*")
      .eq("fid", fid)
      .single();

    if (houseErr || !house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const lastTick = new Date(house.last_tick);
    const hoursDiff = (now.getTime() - lastTick.getTime()) / (1000 * 60 * 60);

    // Calculate mined points since last tick
    const minedPoints = Math.max(0, Math.floor(hoursDiff * house.mining_rate));
    const currentPoints = house.rizz_point + minedPoints;

    return NextResponse.json({
      current_points: currentPoints,
      rizz_point: house.rizz_point,
      mining_rate: house.mining_rate,
      last_tick: house.last_tick,
      level: house.level
    });
  } catch (error) {
    console.error("Mining calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}