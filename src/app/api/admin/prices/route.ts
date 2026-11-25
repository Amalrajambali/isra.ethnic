import { NextResponse } from "next/server";
import { getInstagramFeed } from "@/lib/instagram";
import { getPrices, isAdminRequest, setPrice } from "@/lib/prices";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);

  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return error("INSTAGRAM_ACCESS_TOKEN is not set", 500);

  try {
    const [{ photos }, prices] = await Promise.all([getInstagramFeed(token), getPrices()]);
    return NextResponse.json(
      { posts: photos.map((photo) => ({ ...photo, price: prices[photo.id] || null })) },
      { headers: noStore }
    );
  } catch (err) {
    return error(err instanceof Error ? err.message : "Could not load posts", 500);
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const price = String(body?.price ?? "").replace(/[,\s₹]/g, "");

  if (!id.startsWith("insta-")) return error("Invalid post", 400);
  if (price && !/^\d{1,7}$/.test(price)) return error("Price must be a number, e.g. 1499", 400);

  try {
    await setPrice(id, price || null);
    return NextResponse.json({ id, price: price || null }, { headers: noStore });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Could not save price", 500);
  }
}
