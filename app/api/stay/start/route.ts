import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { guest_fid, host_fid } = await req.json();
  if (!guest_fid || !host_fid) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await supabaseServer
    .from("stays")
    .update({ end_at: new Date().toISOString() })
    .eq("guest_fid", guest_fid)
    .is("end_at", null);
  const { data, error } = await supabaseServer
    .from("stays")
    .insert({ guest_fid, host_fid })
    .select()
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error creating stay" },
      { status: 500 }
    );
  }
  return NextResponse.json({ stay: data });
}
