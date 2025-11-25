import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) return NextResponse.json({ error: "Missing fid" }, { status: 400 });

    // Fetch player
    const { data: player, error: playerErr } = await supabaseServer
      .from("players")
      .select("username, pfp_url")
      .eq("fid", fid)
      .single();
    if (playerErr) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Fetch house
    const { data: house, error: houseErr } = await supabaseServer
      .from("houses")
      .select("level, rizz_point, total_votes")
      .eq("fid", fid)
      .single();
    if (houseErr) return NextResponse.json({ error: "House not found" }, { status: 404 });

    // Stats: total votes given
    const { count: totalVotesGiven } = await supabaseServer
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("voter_fid", fid);

    // Total stays
    const { count: totalStays } = await supabaseServer
      .from("stays")
      .select("*", { count: "exact", head: true })
      .eq("guest_fid", fid);

    // Current guests
    const { count: currentGuests } = await supabaseServer
      .from("stays")
      .select("*", { count: "exact", head: true })
      .eq("host_fid", fid)
      .is("end_at", null);

    return NextResponse.json({
      player,
      house,
      stats: {
        totalVotesGiven: totalVotesGiven || 0,
        totalStays: totalStays || 0,
        currentGuests: currentGuests || 0
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}