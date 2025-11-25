import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { neynarClient } from "@/lib/neynar";

type InitBody = {
  fid: number;
  username?: string;
  pfpUrl?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InitBody;
    if (!body.fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }
    const fid = body.fid;
    let username = body.username;
    let pfpUrl = body.pfpUrl;

    try {
      const resp = await neynarClient.fetchBulkUsers({ fids: [fid] });
      const u = resp.users[0];
      username = username || u.username;
      pfpUrl = pfpUrl || u.pfp_url;
    } catch (e) {
      console.warn("neynar fetchBulkUsers failed", e);
    }

    const { error: upsertPlayerError } = await supabaseServer
      .from("players")
      .upsert(
        {
          fid,
          username: username ?? null,
          pfp_url: pfpUrl ?? null,
          last_seen: new Date().toISOString()
        },
        { onConflict: "fid" }
      );

    if (upsertPlayerError) {
      console.error(upsertPlayerError);
      return NextResponse.json(
        { error: "Failed to upsert player" },
        { status: 500 }
      );
    }

    const { data: house, error: houseErr } = await supabaseServer
      .from("houses")
      .select("*")
      .eq("fid", fid)
      .maybeSingle();

    let finalHouse = house;
    if (houseErr) {
      console.error(houseErr);
      return NextResponse.json(
        { error: "Failed to fetch house" },
        { status: 500 }
      );
    }

    if (!finalHouse) {
      const { data: newHouse, error: newErr } = await supabaseServer
        .from("houses")
        .insert({ fid, level: 1, rizz_point: 0 })
        .select()
        .single();
      if (newErr) {
        console.error(newErr);
        return NextResponse.json(
          { error: "Failed to create house" },
          { status: 500 }
        );
      }
      finalHouse = newHouse;
    }

    return NextResponse.json({
      fid,
      username,
      pfpUrl,
      house: finalHouse
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
