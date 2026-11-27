import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/product-info";
import {
  disconnectYouTube,
  getConnectUrl,
  getRedirectUri,
  getSiteOrigin,
  getYouTubeStatus,
  syncReelsToYouTube,
} from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store" };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);
  try {
    const status = await getYouTubeStatus();
    return NextResponse.json(
      { ...status, redirectUri: getRedirectUri(getSiteOrigin(request)) },
      { headers: noStore }
    );
  } catch (err) {
    return error(err instanceof Error ? err.message : "Could not load YouTube status", 500);
  }
}

// Body: { action: "connect" | "sync" | "disconnect" }
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);
  const body = await request.json().catch(() => null);
  const origin = getSiteOrigin(request);

  try {
    switch (body?.action) {
      case "connect":
        return NextResponse.json({ url: getConnectUrl(origin) }, { headers: noStore });
      case "sync":
        return NextResponse.json(await syncReelsToYouTube({ siteUrl: origin }), { headers: noStore });
      case "disconnect":
        await disconnectYouTube();
        return NextResponse.json({ ok: true }, { headers: noStore });
      default:
        return error("Unknown action", 400);
    }
  } catch (err) {
    return error(err instanceof Error ? err.message : "YouTube request failed", 500);
  }
}
