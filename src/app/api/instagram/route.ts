import { NextResponse, after } from "next/server";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getInstagramFeed } from "@/lib/instagram";
import { getProductInfoSafe } from "@/lib/product-info";
import { fillMissingNames } from "@/lib/ai-names";

export const dynamic = "force-dynamic";

const AI_NAMES_PER_REQUEST = 4;
const AI_WAIT_MS = 4000;

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
    const [feed, { prices, names, hidden }] = await Promise.all([
      getInstagramFeed(token),
      getProductInfoSafe(),
    ]);
    const { reels } = feed;
    if (!reels.length && !feed.photos.length) return fallback("Instagram returned no posts");

    // Posts hidden in /admin (greetings, announcements) are left out and never sent to the AI.
    const photos = feed.photos.filter((photo) => !hidden.has(photo.id));

    // Name new posts now, but never hold the page longer than AI_WAIT_MS; slower ones finish after the response.
    const naming = fillMissingNames(photos, names, AI_NAMES_PER_REQUEST);
    after(() => naming);
    const generated = await Promise.race([
      naming,
      new Promise<Record<string, string>>((resolve) => setTimeout(() => resolve({}), AI_WAIT_MS)),
    ]);

    // Only the admin name or the AI name is shown, never the Instagram caption.
    const pricedPhotos = photos.map((photo) => ({
      ...photo,
      description: names[photo.id] || generated[photo.id] || "",
      price: prices[photo.id] || null,
    }));

    // Short CDN cache so a price saved in /admin shows on the site within a minute.
    return NextResponse.json(
      { source: "instagram", reels: reels.length ? reels : fallbackReels(), photos: pricedPhotos },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram request failed";
    console.error("Instagram feed error:", message);
    return fallback(message);
  }
}
