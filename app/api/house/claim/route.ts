import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { miningRate, staySplit } from "@/lib/economy";

function overlapHours(
  start: Date,
  end: Date | null,
  windowStart: Date,
  windowEnd: Date
): number {
  const s = start < windowStart ? windowStart : start;
  const e = (end ?? windowEnd) > windowEnd ? windowEnd : (end ?? windowEnd);
  if (e <= s) return 0;
  return (e.getTime() - s.getTime()) / 3_600_000;
}

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const { data: house, error: houseErr } = await supabaseServer
      .from("houses")
      .select("*")
      .eq("fid", fid)
      .single();

    if (houseErr || !house) {
      console.error(houseErr);
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const lastTick = new Date(house.last_tick);
    const windowStart = lastTick;
    const windowEnd = now;

    const baseRate = miningRate(house.level);
    const baseHours = (windowEnd.getTime() - windowStart.getTime()) / 3_600_000;
    const baseEarned = Math.max(0, Math.floor(baseRate * baseHours));

    const { data: stays, error: staysErr } = await supabaseServer
      .from("stays")
      .select("id, guest_fid, host_fid, start_at, end_at")
      .or(`guest_fid.eq.${fid},host_fid.eq.${fid}`);

    if (staysErr) {
      console.warn("stays load error", staysErr);
    }

    const split = staySplit();
    let guestReward = 0;
    let hostReward = 0;

    if (stays && stays.length > 0) {
      const hostIds = Array.from(new Set(stays.map((s: any) => s.host_fid))) as number[];
      const { data: hostHouses } = await supabaseServer
        .from("houses")
        .select("fid, level")
        .in("fid", hostIds);

      const hostLevelMap = new Map<number, number>();
      (hostHouses || []).forEach((h: any) => {
        hostLevelMap.set(h.fid, h.level);
      });

      for (const s of stays as any[]) {
        const start = new Date(s.start_at);
        const end = s.end_at ? new Date(s.end_at) : null;
        const hours = overlapHours(start, end, windowStart, windowEnd);
        if (hours <= 0) continue;
        const hostLevel = hostLevelMap.get(s.host_fid) ?? 1;
        const rate = miningRate(hostLevel);
        const pot = rate * hours;
        if (s.guest_fid === fid) {
          guestReward += pot * split.guestShare;
        }
        if (s.host_fid === fid) {
          hostReward += pot * split.hostShare;
        }
      }
    }

    const totalEarned = baseEarned + Math.floor(guestReward) + Math.floor(hostReward);
    const newBaseRizz = house.rizz_point + totalEarned;

    const { data: updatedHouse, error: updateErr } = await supabaseServer
      .from("houses")
      .update({
        rizz_point: newBaseRizz,
        last_tick: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq("fid", fid)
      .select()
      .single();

    if (updateErr) {
      console.error(updateErr);
      return NextResponse.json(
        { error: "Failed to update house" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      earned: {
        base: baseEarned,
        guest: Math.floor(guestReward),
        host: Math.floor(hostReward),
        total: totalEarned
      },
      house: updatedHouse
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
