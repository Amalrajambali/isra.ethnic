import type { ImagePlaceholder } from "@/app/lib/placeholder-images";

const GRAPH_URL = "https://graph.instagram.com";
const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}";
const MAX_ITEMS = 60;
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 10 * 60 * 1000;

type InstagramChild = {
  media_type: "IMAGE" | "VIDEO";
  media_url?: string;
  thumbnail_url?: string;
};

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: InstagramChild[] };
};

type InstagramMediaPage = {
  data: InstagramMedia[];
  paging?: { next?: string };
};

export type InstagramFeedData = {
  reels: ImagePlaceholder[];
  photos: ImagePlaceholder[];
};

let lastRefreshAt = 0;
let cachedFeed: { data: InstagramFeedData; expiresAt: number } | null = null;

// Long-lived tokens expire after 60 days unless refreshed, so extend it at most once a day.
function refreshTokenInBackground(token: string) {
  if (Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) return;
  lastRefreshAt = Date.now();

  fetch(`${GRAPH_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`, {
    cache: "no-store",
  }).catch(() => {});
}

function getCaption(media: InstagramMedia) {
  return media.caption?.split("\n")[0]?.trim() || "ISRA Ethnic on Instagram";
}

// Carousel media_url can point to a video when the first slide is a video, so use the first image slide.
function getPhotoUrl(media: InstagramMedia) {
  if (media.media_type !== "CAROUSEL_ALBUM") return media.media_url;

  const slides = media.children?.data || [];
  const firstImage = slides.find((slide) => slide.media_type === "IMAGE");
  return firstImage?.media_url || slides[0]?.thumbnail_url || media.thumbnail_url;
}

// Only successful responses are cached, so a fixed token or a recovered API shows up on the next request.
export async function getInstagramFeed(token: string): Promise<InstagramFeedData> {
  if (cachedFeed && cachedFeed.expiresAt > Date.now()) return cachedFeed.data;

  const data = await fetchInstagramFeed(token);
  cachedFeed = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

async function fetchInstagramFeed(token: string): Promise<InstagramFeedData> {
  refreshTokenInBackground(token);

  const items: InstagramMedia[] = [];
  let nextUrl: string | undefined =
    `${GRAPH_URL}/me/media?fields=${MEDIA_FIELDS}&limit=25&access_token=${token}`;

  while (nextUrl && items.length < MAX_ITEMS) {
    const response: Response = await fetch(nextUrl, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message || `Instagram request failed: ${response.status}`);
    }

    const page = (await response.json()) as InstagramMediaPage;
    items.push(...page.data);
    nextUrl = page.paging?.next;
  }

  const reels: ImagePlaceholder[] = [];
  const photos: ImagePlaceholder[] = [];

  for (const media of items.slice(0, MAX_ITEMS)) {
    const base = {
      id: `insta-${media.id}`,
      description: getCaption(media),
      imageHint: "ethnic fashion",
      permalink: media.permalink,
    };

    if (media.media_type === "VIDEO") {
      reels.push({ ...base, imageUrl: media.thumbnail_url, reelUrl: media.permalink });
    } else {
      const imageUrl = getPhotoUrl(media);
      if (imageUrl) photos.push({ ...base, imageUrl });
    }
  }

  return { reels, photos };
}
