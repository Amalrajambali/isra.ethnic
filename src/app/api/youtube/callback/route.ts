import { NextResponse } from "next/server";
import { completeConnect, getSiteOrigin, verifyState } from "@/lib/youtube";

export const dynamic = "force-dynamic";

// Google sends the admin back here after they allow uploads; we save the token and return to /admin.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getSiteOrigin(request);
  const back = (params: Record<string, string>) =>
    NextResponse.redirect(`${origin}/admin?${new URLSearchParams(params)}`);

  if (url.searchParams.get("error")) return back({ youtubeError: "Google sign-in was cancelled" });
  if (!verifyState(url.searchParams.get("state"))) {
    return back({ youtubeError: "Connect link expired. Click Connect YouTube again." });
  }

  const code = url.searchParams.get("code");
  if (!code) return back({ youtubeError: "Google did not send a sign-in code" });

  try {
    const channel = await completeConnect(code, origin);
    return back({ youtube: channel });
  } catch (err) {
    return back({ youtubeError: err instanceof Error ? err.message : "Could not connect YouTube" });
  }
}
