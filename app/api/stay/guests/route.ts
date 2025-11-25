import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { host_fid } = await req.json();
    if (!host_fid) return NextResponse.json({ error: "Missing host_fid" }, { status: 400 });

    const { count, error } = await supabaseServer
      .from("stays")
      .select("*", { count: "exact", head: true })
      .eq("host_fid", host_fid)
      .is("end_at", null);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to count guests" }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}