import { timingSafeEqual } from "node:crypto";

// Prices live in one Redis hash (post id -> price), set from the /admin page.
// Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash database sets UPSTASH_REDIS_REST_*.
const PRICES_KEY = "isra:prices";

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis<T>(command: string[]): Promise<T> {
  const config = getRedisConfig();
  if (!config) throw new Error("Price storage is not configured (KV_REST_API_URL / KV_REST_API_TOKEN)");

  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.error) throw new Error(body?.error || `Redis request failed: ${response.status}`);
  return body.result as T;
}

export async function getPrices(): Promise<Record<string, string>> {
  const flat = await redis<string[]>(["HGETALL", PRICES_KEY]);
  const prices: Record<string, string> = {};
  for (let index = 0; index < flat.length; index += 2) prices[flat[index]] = flat[index + 1];
  return prices;
}

// The website must keep working when storage is down or not set up yet, just without prices.
export async function getPricesSafe() {
  try {
    return await getPrices();
  } catch (error) {
    console.error("Price storage error:", error instanceof Error ? error.message : error);
    return {};
  }
}

export async function setPrice(id: string, price: string | null) {
  if (price) await redis(["HSET", PRICES_KEY, id, price]);
  else await redis(["HDEL", PRICES_KEY, id]);
}

export function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = request.headers.get("x-admin-password");
  if (!expected || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
