import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { host_fid } = await req.json();
    if (!host_fid) return NextResponse.json({ error: "Missing host_fid" }, { status: 400 });

    const { data: stays, error } = await supabaseServer
      .from("stays")
      .select(`
        guest_fid,
        start_at,
        players:guest_fid (username)
      `)
      .eq("host_fid", host_fid)
      .is("end_at", null);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
    }

    const guests = (stays || []).map((s: any) => ({
      guest_fid: s.guest_fid,
      username: s.players?.username || `fid:${s.guest_fid}`,
      start_at: s.start_at
    }));

    return NextResponse.json({ guests });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}