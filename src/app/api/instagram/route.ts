import { NextResponse } from "next/server";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getInstagramFeed } from "@/lib/instagram";

export const revalidate = 600;

const fallbackFeed = () => PlaceHolderImages.filter((item) => item.id.startsWith("insta-"));

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return NextResponse.json(fallbackFeed());

  try {
    const feed = await getInstagramFeed(token);
    return NextResponse.json(feed.length ? feed : fallbackFeed());
  } catch (error) {
    console.error(error);
    return NextResponse.json(fallbackFeed());
  }
}
