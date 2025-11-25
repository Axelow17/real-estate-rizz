import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) return NextResponse.json({ error: "Missing fid" }, { status: 400 });

    const { data: house, error } = await supabaseServer
      .from("houses")
      .select("level, total_votes")
      .eq("fid", fid)
      .single();

    if (error || !house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    return NextResponse.json({ house });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}