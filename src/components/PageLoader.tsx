"use client";

import { useEffect, useState } from "react";
import { loadFeed } from "@/components/InstagramFeed";

// Never keep visitors waiting longer than this, even if Instagram or the network is slow.
const MAX_WAIT_MS = 8000;
// Only the photos visible on the first page need to be downloaded before the site is shown.
const PHOTOS_TO_PRELOAD = 8;

function preloadImage(url?: string) {
  return new Promise<void>((resolve) => {
    if (!url) return resolve();
    const image = new Image();
    image.onload = image.onerror = () => resolve();
    image.src = url;
  });
}

async function waitForInstagram() {
  const feed = await loadFeed();
  const photos = feed?.source === "instagram" ? feed.photos : [];
  await Promise.all(photos.slice(0, PHOTOS_TO_PRELOAD).map((photo) => preloadImage(photo.imageUrl)));
}

// Covers the page until the Instagram feed and its first photos are ready, so the site appears complete.
export function PageLoader() {
  const [state, setState] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      document.documentElement.style.overflow = "";
      setState("fading");
      setTimeout(() => setState("done"), 500);
    };

    waitForInstagram().finally(finish);
    const timeout = setTimeout(finish, MAX_WAIT_MS);

    return () => {
      clearTimeout(timeout);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (state === "done") return null;

  return (
    <div
      role="status"
      aria-label="Loading ISRA Ethnic"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-500 ${
        state === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="font-headline text-3xl sm:text-4xl tracking-tighter text-primary font-bold">
        ISRA <span className="text-foreground font-light">ETHNIC</span>
      </div>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Loading the latest collection</p>
    </div>
  );
}
