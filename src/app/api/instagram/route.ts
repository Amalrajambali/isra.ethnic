import { NextResponse } from "next/server";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getInstagramFeed } from "@/lib/instagram";

export const revalidate = 600;

const fallbackReels = () =>
  PlaceHolderImages.filter((item) => item.id.startsWith("insta-") && item.reelUrl);
const fallbackPhotos = () =>
  PlaceHolderImages.filter((item) => item.id.startsWith("insta-") && !item.reelUrl && item.imageUrl);

function fallback(reason: string) {
  return NextResponse.json({
    source: "fallback",
    reason,
    reels: fallbackReels(),
    photos: fallbackPhotos(),
  });
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return fallback("INSTAGRAM_ACCESS_TOKEN is not set");

  try {
    const { reels, photos } = await getInstagramFeed(token);
    if (!reels.length && !photos.length) return fallback("Instagram returned no posts");

    return NextResponse.json({
      source: "instagram",
      reels: reels.length ? reels : fallbackReels(),
      photos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram request failed";
    console.error("Instagram feed error:", message);
    return fallback(message);
  }
}
