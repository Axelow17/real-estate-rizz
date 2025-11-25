import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { guest_fid } = await req.json();
  if (!guest_fid) {
    return NextResponse.json({ error: "Missing guest_fid" }, { status: 400 });
  }
  const { data, error } = await supabaseServer
    .from("stays")
    .update({ end_at: new Date().toISOString() })
    .eq("guest_fid", guest_fid)
    .is("end_at", null)
    .select()
    .maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to stop stay" },
      { status: 500 }
    );
  }
  return NextResponse.json({ stopped: true, stay: data });
}
