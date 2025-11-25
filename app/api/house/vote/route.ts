import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { voter_fid, host_fid } = await req.json();
  if (!voter_fid || !host_fid) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseServer
    .from("votes")
    .select("*")
    .eq("voter_fid", voter_fid)
    .eq("voted_at", today)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Already voted today" },
      { status: 400 }
    );
  }
  const { error: insertErr } = await supabaseServer
    .from("votes")
    .insert({ voter_fid, host_fid, voted_at: today });
  if (insertErr) {
    console.error(insertErr);
    return NextResponse.json(
      { error: "Failed to insert vote" },
      { status: 500 }
    );
  }
  const { data: house, error: houseErr } = await supabaseServer
    .from("houses")
    .select("*")
    .eq("fid", host_fid)
    .single();
  if (!house || houseErr) {
    console.error(houseErr);
    return NextResponse.json(
      { error: "Host house not found" },
      { status: 500 }
    );
  }
  const { error: updateErr } = await supabaseServer
    .from("houses")
    .update({ total_votes: (house.total_votes || 0) + 1 })
    .eq("fid", host_fid);
  if (updateErr) {
    console.error(updateErr);
    return NextResponse.json(
      { error: "Failed to update votes" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
