import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSiteOrigin, syncReelsToYouTube } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" by itself. Free schedulers such as
// cron-job.org can send the same header, or call /api/cron/youtube-sync?key=<CRON_SECRET>.
function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const given = header || new URL(request.url).searchParams.get("key") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await syncReelsToYouTube({ siteUrl: getSiteOrigin(request) });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube sync failed";
    console.error("YouTube sync error:", message);
    return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
