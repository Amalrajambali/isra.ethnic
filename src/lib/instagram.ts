import type { ImagePlaceholder } from "@/app/lib/placeholder-images";

const GRAPH_URL = "https://graph.instagram.com";
const MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const MAX_ITEMS = 48;
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type InstagramMediaPage = {
  data: InstagramMedia[];
  paging?: { next?: string };
};

let lastRefreshAt = 0;

// Long-lived tokens expire after 60 days unless refreshed, so extend it at most once a day.
function refreshTokenInBackground(token: string) {
  if (Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) return;
  lastRefreshAt = Date.now();

  fetch(`${GRAPH_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`, {
    cache: "no-store",
  }).catch(() => {});
}

function toFeedItem(media: InstagramMedia): ImagePlaceholder {
  const caption = media.caption?.split("\n")[0]?.trim();
  const isVideo = media.media_type === "VIDEO";

  return {
    id: `insta-${media.id}`,
    description: caption || "ISRA Ethnic on Instagram",
    imageHint: "ethnic fashion",
    imageUrl: isVideo ? media.thumbnail_url : media.media_url,
    reelUrl: isVideo ? media.permalink : undefined,
    permalink: media.permalink,
  };
}

export async function getInstagramFeed(token: string): Promise<ImagePlaceholder[]> {
  refreshTokenInBackground(token);

  const items: InstagramMedia[] = [];
  let nextUrl: string | undefined =
    `${GRAPH_URL}/me/media?fields=${MEDIA_FIELDS}&limit=25&access_token=${token}`;

  while (nextUrl && items.length < MAX_ITEMS) {
    const response = await fetch(nextUrl, { next: { revalidate: 600 } });
    if (!response.ok) throw new Error(`Instagram request failed: ${response.status}`);

    const page = (await response.json()) as InstagramMediaPage;
    items.push(...page.data);
    nextUrl = page.paging?.next;
  }

  return items.slice(0, MAX_ITEMS).map(toFeedItem);
}
