import { NextResponse } from "next/server";
import { getInstagramFeed } from "@/lib/instagram";
import { getProductInfo, isAdminRequest, setHidden, setName, setPrice } from "@/lib/product-info";
import { fillMissingNames } from "@/lib/ai-names";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store" };
const MAX_NAME_LENGTH = 40;
const AI_NAMES_PER_LOAD = 8;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);

  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return error("INSTAGRAM_ACCESS_TOKEN is not set", 500);

  try {
    const [{ photos }, info] = await Promise.all([getInstagramFeed(token), getProductInfo()]);
    const visible = photos.filter((photo) => !info.hidden.has(photo.id));
    const names = { ...info.names, ...(await fillMissingNames(visible, info.names, AI_NAMES_PER_LOAD)) };

    return NextResponse.json(
      {
        posts: photos.map((photo) => ({
          id: photo.id,
          caption: photo.description,
          imageUrl: photo.imageUrl,
          permalink: photo.permalink,
          name: names[photo.id] || "",
          price: info.prices[photo.id] || null,
          hidden: info.hidden.has(photo.id),
        })),
      },
      { headers: noStore }
    );
  } catch (err) {
    return error(err instanceof Error ? err.message : "Could not load posts", 500);
  }
}

// Body: { id, price?, name?, hidden? }. Only the fields sent are changed; an empty price/name removes it.
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return error("Wrong password", 401);

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id.startsWith("insta-")) return error("Invalid post", 400);

  const hasPrice = body && "price" in body;
  const hasName = body && "name" in body;
  const hasHidden = body && typeof body.hidden === "boolean";
  if (!hasPrice && !hasName && !hasHidden) return error("Nothing to save", 400);

  const price = hasPrice ? String(body.price ?? "").replace(/[,\s₹]|rs\.?/gi, "") : "";
  const name = hasName ? String(body.name ?? "").replace(/\s+/g, " ").trim() : "";

  if (price && !/^\d{1,7}$/.test(price)) return error("Price must be a number, e.g. 1499", 400);
  if (name.length > MAX_NAME_LENGTH) return error(`Name must be ${MAX_NAME_LENGTH} characters or less`, 400);

  try {
    await Promise.all([
      hasPrice ? setPrice(id, price || null) : null,
      hasName ? setName(id, name || null) : null,
      hasHidden ? setHidden(id, body.hidden) : null,
    ]);
    return NextResponse.json(
      {
        id,
        ...(hasPrice && { price: price || null }),
        ...(hasName && { name: name || null }),
        ...(hasHidden && { hidden: body.hidden }),
      },
      { headers: noStore }
    );
  } catch (err) {
    return error(err instanceof Error ? err.message : "Could not save", 500);
  }
}
