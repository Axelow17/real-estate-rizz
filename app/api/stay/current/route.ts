import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { guest_fid } = await req.json();
  if (!guest_fid) {
    return NextResponse.json({ error: "Missing guest_fid" }, { status: 400 });
  }
  const { data, error } = await supabaseServer
    .from("stays")
    .select(
      `id, host_fid, start_at, end_at,
       host:players!stays_host_fid_fkey (username),
       house:houses (level)`
    )
    .eq("guest_fid", guest_fid)
    .is("end_at", null)
    .maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch current stay" },
      { status: 500 }
    );
  }
  return NextResponse.json({ stay: data });
}
