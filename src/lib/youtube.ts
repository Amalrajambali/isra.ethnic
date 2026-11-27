import { createHmac, timingSafeEqual } from "node:crypto";
import { getCaption, getRecentReels, type InstagramReel } from "@/lib/instagram";
import { redis } from "@/lib/product-info";

// Instagram reels are copied to YouTube as Shorts. State lives in Redis:
//   refresh token  - saved once when the admin connects YouTube in /admin
//   since          - when YouTube was first connected; only reels posted after this are uploaded,
//                    so connecting doesn't flood the channel with every old reel
//   posted         - reel id -> YouTube video id, so a reel is never uploaded twice
const TOKEN_KEY = "isra:youtube:refresh-token";
const CHANNEL_KEY = "isra:youtube:channel";
const SINCE_KEY = "isra:youtube:since";
const POSTED_KEY = "isra:youtube:posted";
const ATTEMPTS_KEY = "isra:youtube:attempts";
const LOG_KEY = "isra:youtube:log";
const LAST_RUN_KEY = "isra:youtube:last-run";
const LOCK_PREFIX = "isra:youtube:lock:";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];
const MAX_ATTEMPTS = 3;
const STATE_MAX_AGE_MS = 15 * 60 * 1000;
const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 4500;
// Category 26 = "Howto & Style", which is where fashion content lives on YouTube.
const CATEGORY_ID = "26";

export type UploadLogEntry = { reelId: string; videoId: string; title: string; permalink: string; at: string };
export type SyncResult = {
  at: string;
  uploaded: UploadLogEntry[];
  failed: { reelId: string; error: string }[];
  skipped: { reelId: string; reason: string }[];
  message?: string;
};

function getClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export const isYouTubeConfigured = () => Boolean(getClient());

function requireClient() {
  const client = getClient();
  if (!client) throw new Error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET are not set");
  return client;
}

// SITE_URL pins the address (e.g. https://israethnic.com) so the Google redirect URI is the same
// whether the request came through the custom domain or the *.vercel.app one.
export const getSiteOrigin = (request: Request) =>
  process.env.SITE_URL?.trim().replace(/\/+$/, "") || new URL(request.url).origin;

export const getRedirectUri = (origin: string) => `${origin}/api/youtube/callback`;

// The OAuth "state" proves the callback came from a connect started in /admin: a timestamp signed with the admin password.
function sign(value: string) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(value).digest("hex");
}

export function verifyState(state: string | null) {
  const [timestamp, signature] = (state || "").split(".");
  if (!timestamp || !signature || !process.env.ADMIN_PASSWORD) return false;
  if (Date.now() - Number(timestamp) > STATE_MAX_AGE_MS) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(timestamp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getConnectUrl(origin: string) {
  const { clientId } = requireClient();
  const timestamp = String(Date.now());
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    // offline + consent makes Google return a refresh token every time, so the sync can run without the admin.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: `${timestamp}.${sign(timestamp)}`,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function requestToken(params: Record<string, string>) {
  const { clientId, clientSecret } = requireClient();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (body?.error === "invalid_grant") {
      throw new Error("YouTube connection expired or was revoked. Reconnect YouTube in /admin.");
    }
    throw new Error(body?.error_description || body?.error || `Google token request failed: ${response.status}`);
  }
  return body as { access_token: string; refresh_token?: string };
}

async function getChannelTitle(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return (body?.items?.[0]?.snippet?.title as string | undefined) || "";
}

// Called from the OAuth callback: stores the refresh token and starts the "only new reels" clock on first connect.
export async function completeConnect(code: string, origin: string) {
  const tokens = await requestToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(origin),
  });
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Try connecting again.");

  const channel = await getChannelTitle(tokens.access_token);
  if (!channel) throw new Error("This Google account has no YouTube channel. Pick the ISRA channel when signing in.");

  await Promise.all([
    redis(["SET", TOKEN_KEY, tokens.refresh_token]),
    redis(["SET", CHANNEL_KEY, channel]),
    redis(["SET", SINCE_KEY, new Date().toISOString(), "NX"]),
  ]);
  return channel;
}

export async function disconnectYouTube() {
  await Promise.all([redis(["DEL", TOKEN_KEY]), redis(["DEL", CHANNEL_KEY])]);
}

export async function getYouTubeStatus() {
  const [token, channel, since, lastRun, log] = await Promise.all([
    redis<string | null>(["GET", TOKEN_KEY]),
    redis<string | null>(["GET", CHANNEL_KEY]),
    redis<string | null>(["GET", SINCE_KEY]),
    redis<string | null>(["GET", LAST_RUN_KEY]),
    redis<string[]>(["LRANGE", LOG_KEY, "0", "9"]),
  ]);
  return {
    configured: isYouTubeConfigured(),
    connected: Boolean(token),
    channel: channel || "",
    since,
    lastRun: lastRun ? (JSON.parse(lastRun) as SyncResult) : null,
    recent: log.map((entry) => JSON.parse(entry) as UploadLogEntry),
  };
}

// YouTube rejects "<" and ">" in titles and descriptions.
const clean = (text: string) => text.replace(/[<>]/g, "");

function buildMetadata(reel: InstagramReel, siteUrl: string) {
  const caption = getCaption(reel);
  const baseTitle = clean(caption === "ISRA Ethnic on Instagram" ? "ISRA Ethnic" : caption);
  const suffix = " #Shorts";
  const title = baseTitle.slice(0, TITLE_LIMIT - suffix.length).trim() + suffix;

  const description = [
    clean(reel.caption).slice(0, DESCRIPTION_LIMIT),
    "",
    `Shop ISRA Ethnic: ${siteUrl}`,
    "#Shorts #ISRAEthnic",
  ].join("\n");

  return {
    snippet: { title, description, categoryId: CATEGORY_ID },
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false, embeddable: true },
  };
}

// Resumable upload: one request with the metadata returns an upload URL, a second sends the video bytes.
async function uploadReel(reel: InstagramReel, accessToken: string, siteUrl: string) {
  const video = await fetch(reel.mediaUrl!, { cache: "no-store" });
  if (!video.ok) throw new Error(`Could not download the reel from Instagram: ${video.status}`);
  const contentType = video.headers.get("content-type") || "video/mp4";
  const bytes = await video.arrayBuffer();

  const metadata = buildMetadata(reel, siteUrl);
  const start = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(bytes.byteLength),
      },
      body: JSON.stringify(metadata),
      cache: "no-store",
    }
  );
  const uploadUrl = start.headers.get("location");
  if (!start.ok || !uploadUrl) throw new Error(await youTubeError(start));

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
    cache: "no-store",
  });
  if (!upload.ok) throw new Error(await youTubeError(upload));

  const body = (await upload.json()) as { id: string };
  return { videoId: body.id, title: metadata.snippet.title };
}

class QuotaError extends Error {}

async function youTubeError(response: Response) {
  const body = await response.json().catch(() => null);
  const reason = body?.error?.errors?.[0]?.reason;
  if (reason === "quotaExceeded" || reason === "uploadLimitExceeded") {
    throw new QuotaError("YouTube daily upload limit reached. The rest will upload tomorrow.");
  }
  return body?.error?.message || `YouTube upload failed: ${response.status}`;
}

export async function syncReelsToYouTube({ siteUrl, maxUploads = 1 }: { siteUrl: string; maxUploads?: number }) {
  const result: SyncResult = { at: new Date().toISOString(), uploaded: [], failed: [], skipped: [] };

  const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!instagramToken) throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");
  requireClient();

  const [refreshToken, since] = await Promise.all([
    redis<string | null>(["GET", TOKEN_KEY]),
    redis<string | null>(["GET", SINCE_KEY]),
  ]);
  if (!refreshToken || !since) throw new Error("YouTube is not connected yet. Connect it in /admin.");

  const [reels, postedFlat, attemptsFlat] = await Promise.all([
    getRecentReels(instagramToken),
    redis<string[]>(["HKEYS", POSTED_KEY]),
    redis<string[]>(["HGETALL", ATTEMPTS_KEY]),
  ]);
  const posted = new Set(postedFlat);
  const attempts: Record<string, number> = {};
  for (let i = 0; i < attemptsFlat.length; i += 2) attempts[attemptsFlat[i]] = Number(attemptsFlat[i + 1]);

  // Oldest first, so the Shorts appear on YouTube in the same order as on Instagram.
  const sinceMs = Date.parse(since);
  const pending = reels
    .filter((reel) => Date.parse(reel.timestamp) > sinceMs && !posted.has(reel.id))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  let accessToken = "";
  for (const reel of pending) {
    if (result.uploaded.length >= maxUploads) break;
    if (!reel.mediaUrl) {
      result.skipped.push({ reelId: reel.id, reason: "Instagram blocks downloading this reel (copyrighted music)" });
      continue;
    }
    if ((attempts[reel.id] || 0) >= MAX_ATTEMPTS) {
      result.skipped.push({ reelId: reel.id, reason: `Failed ${MAX_ATTEMPTS} times, gave up` });
      continue;
    }

    // The lock stops two overlapping runs (cron + "Sync now") from uploading the same reel twice.
    const locked = await redis<string | null>(["SET", `${LOCK_PREFIX}${reel.id}`, "1", "NX", "EX", "600"]);
    if (!locked) continue;

    try {
      accessToken ||= (await requestToken({ refresh_token: refreshToken, grant_type: "refresh_token" })).access_token;
      const { videoId, title } = await uploadReel(reel, accessToken, siteUrl);
      const entry: UploadLogEntry = { reelId: reel.id, videoId, title, permalink: reel.permalink, at: result.at };

      await Promise.all([
        redis(["HSET", POSTED_KEY, reel.id, videoId]),
        redis(["LPUSH", LOG_KEY, JSON.stringify(entry)]),
      ]);
      await redis(["LTRIM", LOG_KEY, "0", "49"]);
      result.uploaded.push(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      if (error instanceof QuotaError) {
        result.message = message;
        break;
      }
      await redis(["HINCRBY", ATTEMPTS_KEY, reel.id, "1"]);
      result.failed.push({ reelId: reel.id, error: message });
      // A broken connection fails every reel the same way, so stop instead of burning attempts.
      if (message.includes("Reconnect YouTube")) break;
    } finally {
      await redis(["DEL", `${LOCK_PREFIX}${reel.id}`]);
    }
  }

  if (!result.message) {
    const left = pending.length - result.uploaded.length - result.skipped.length - result.failed.length;
    result.message = left > 0 ? `${left} more reel(s) will upload on the next run` : "Up to date";
  }
  await redis(["SET", LAST_RUN_KEY, JSON.stringify(result)]);
  return result;
}
