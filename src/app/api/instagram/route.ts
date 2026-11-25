import { NextResponse, after } from "next/server";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getInstagramFeed } from "@/lib/instagram";
import { getProductInfoSafe } from "@/lib/product-info";
import { fillMissingNames } from "@/lib/ai-names";

export const dynamic = "force-dynamic";

const AI_NAMES_PER_REQUEST = 4;

const fallbackReels = () =>
  PlaceHolderImages.filter((item) => item.id.startsWith("insta-") && item.reelUrl);
const fallbackPhotos = () =>
  PlaceHolderImages.filter((item) => item.id.startsWith("insta-") && !item.reelUrl && item.imageUrl);

function fallback(reason: string) {
  return NextResponse.json(
    { source: "fallback", reason, reels: fallbackReels(), photos: fallbackPhotos() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return fallback("INSTAGRAM_ACCESS_TOKEN is not set");

  try {
    const [{ reels, photos }, { prices, names }] = await Promise.all([
      getInstagramFeed(token),
      getProductInfoSafe(),
    ]);
    if (!reels.length && !photos.length) return fallback("Instagram returned no posts");

    const pricedPhotos = photos.map((photo) => ({
      ...photo,
      description: names[photo.id] || photo.description,
      price: prices[photo.id] || null,
    }));

    // New posts get their AI name after the response is sent, so visitors never wait on Gemini.
    after(() => fillMissingNames(photos, names, AI_NAMES_PER_REQUEST));

    // Short CDN cache so a price saved in /admin shows on the site within a minute.
    return NextResponse.json(
      { source: "instagram", reels: reels.length ? reels : fallbackReels(), photos: pricedPhotos },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram request failed";
    console.error("Instagram feed error:", message);
    return fallback(message);
  }
}
