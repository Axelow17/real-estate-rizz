import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { upgradeCost, miningRate } from "@/lib/economy";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    // First get current points by calculating from rizz_point + mined
    const { data: house } = await supabaseServer
      .from("houses")
      .select("*")
      .eq("fid", fid)
      .single();

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    if (house.level >= 10) {
      return NextResponse.json({ error: "Max level reached (10)" }, { status: 400 });
    }

    // Calculate current points
    const now = new Date();
    const lastTick = new Date(house.last_tick);
    const hoursDiff = (now.getTime() - lastTick.getTime()) / (1000 * 60 * 60);
    const minedPoints = Math.max(0, Math.floor(hoursDiff * house.mining_rate));
    const currentPoints = house.rizz_point + minedPoints;

    const cost = upgradeCost(house.level);
    if (currentPoints < cost) {
      return NextResponse.json(
        { error: "Not enough Rizz Points", cost },
        { status: 400 }
      );
    }

    const newLevel = house.level + 1;
    const newMiningRate = miningRate(newLevel);

    const { data: updatedHouse, error } = await supabaseServer
      .from("houses")
      .update({
        level: newLevel,
        rizz_point: currentPoints - cost,
        mining_rate: newMiningRate,
        last_tick: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq("fid", fid)
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Upgrade failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ house: updatedHouse });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
