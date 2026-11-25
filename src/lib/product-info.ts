import { timingSafeEqual } from "node:crypto";

// Prices and product names live in Redis hashes (post id -> value), set from /admin or by the AI namer.
// Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash database sets UPSTASH_REDIS_REST_*.
const PRICES_KEY = "isra:prices";
const NAMES_KEY = "isra:names";

export type ProductInfo = {
  prices: Record<string, string>;
  names: Record<string, string>;
};

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

async function getHash(key: string) {
  const flat = await redis<string[]>(["HGETALL", key]);
  const values: Record<string, string> = {};
  for (let index = 0; index < flat.length; index += 2) values[flat[index]] = flat[index + 1];
  return values;
}

async function setField(key: string, id: string, value: string | null) {
  if (value) await redis(["HSET", key, id, value]);
  else await redis(["HDEL", key, id]);
}

export async function getProductInfo(): Promise<ProductInfo> {
  const [prices, names] = await Promise.all([getHash(PRICES_KEY), getHash(NAMES_KEY)]);
  return { prices, names };
}

// The website must keep working when storage is down or not set up yet, just without prices and names.
export async function getProductInfoSafe(): Promise<ProductInfo> {
  try {
    return await getProductInfo();
  } catch (error) {
    console.error("Price storage error:", error instanceof Error ? error.message : error);
    return { prices: {}, names: {} };
  }
}

// Counts AI calls per day across all server instances; returns false once today's limit is used up.
export async function takeDailyAiQuota(limit: number) {
  const key = `isra:ai-calls:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis<number>(["INCR", key]);
  if (count === 1) await redis(["EXPIRE", key, String(2 * 24 * 60 * 60)]);
  return count <= limit;
}

export const setPrice =(id: string, price: string | null) => setField(PRICES_KEY, id, price);
export const setName = (id: string, name: string | null) => setField(NAMES_KEY, id, name);

// AI names only fill an empty slot (HSETNX), so a name typed in /admin is never overwritten.
export const setAiName = (id: string, name: string) => redis(["HSETNX", NAMES_KEY, id, name]);

export function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = request.headers.get("x-admin-password");
  if (!expected || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
