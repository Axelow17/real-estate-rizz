import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { upgradeCost } from "@/lib/economy";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }
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
    const cost = upgradeCost(house.level);
    if (house.rizz_point < cost) {
      return NextResponse.json(
        { error: "Not enough Rizz Points", cost },
        { status: 400 }
      );
    }
    const { data: updatedHouse, error } = await supabaseServer
      .from("houses")
      .update({
        level: house.level + 1,
        rizz_point: house.rizz_point - cost
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
