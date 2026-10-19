"use client";

import { useEffect, useState } from "react";
import { PlaceHolderImages, type ImagePlaceholder } from "@/app/lib/placeholder-images";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";

const REELS_PER_PAGE = 6;
const PHOTOS_PER_PAGE = 8;
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/isra.ethnic?igsh=dnhtNHQ5dGlwdmcw";

const byNewestId = (a: ImagePlaceholder, b: ImagePlaceholder) => {
  const aNumber = Number.parseInt(a.id.replace("insta-", ""), 10);
  const bNumber = Number.parseInt(b.id.replace("insta-", ""), 10);

  if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
    return b.id.localeCompare(a.id);
  }

  return bNumber - aNumber;
};

const fallbackInsta = PlaceHolderImages.filter((p) => p.id.startsWith("insta-")).sort(byNewestId);
const fallbackReels = fallbackInsta.filter((item) => item.reelUrl);
const fallbackPhotos = fallbackInsta.filter((item) => !item.reelUrl && item.imageUrl);

type InstagramFeedResponse = {
  source: "instagram" | "fallback";
  reels: ImagePlaceholder[];
  photos: ImagePlaceholder[];
};

function buildInstagramEmbedUrl(reelUrl: string) {
  const url = new URL(reelUrl);
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}/embed/`;
}

function usePagination<T>(items: T[], perPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(currentPage, totalPages);

  return {
    page,
    totalPages,
    pageItems: items.slice((page - 1) * perPage, page * perPage),
    setPage: setCurrentPage,
  };
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        type="button"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>
      <span className="text-sm font-medium text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function InstagramFeed() {
  const [reels, setReels] = useState<ImagePlaceholder[]>(fallbackReels);
  const [photos, setPhotos] = useState<ImagePlaceholder[]>(fallbackPhotos);

  useEffect(() => {
    fetch("/api/instagram")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: InstagramFeedResponse) => {
        if (data.source !== "instagram") return;
        if (data.reels?.length) setReels(data.reels);
        if (data.photos?.length) setPhotos(data.photos);
      })
      .catch(() => {});
  }, []);

  const reelPages = usePagination(reels, REELS_PER_PAGE);
  const photoPages = usePagination(photos, PHOTOS_PER_PAGE);

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Instagram className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
            <h2 className="font-headline text-2xl sm:text-3xl">Trending Reels</h2>
          </div>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-bold tracking-widest text-xs sm:text-sm uppercase inline-block sm:whitespace-nowrap"
          >
            Follow @isra.ethnic
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {reelPages.pageItems.map((reel) => (
            <div
              key={reel.id}
              className="aspect-[9/16] relative overflow-hidden rounded-2xl bg-card border border-primary/10"
            >
              <iframe
                src={buildInstagramEmbedUrl(reel.reelUrl!)}
                className="w-full h-full border-0"
                allowFullScreen
                scrolling="no"
                allow="encrypted-media"
                loading="lazy"
                title={reel.description}
              />
            </div>
          ))}
        </div>
        <Pagination {...reelPages} />
      </div>

      {photos.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <Instagram className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
            <h2 className="font-headline text-2xl sm:text-3xl">Latest Collection</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {photoPages.pageItems.map((photo) => (
              <a
                key={photo.id}
                href={photo.permalink || INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="block aspect-[4/5] relative group overflow-hidden rounded-2xl bg-card border border-primary/10"
              >
                {/* Instagram CDN links are signed and expire, so load them directly instead of through next/image. */}
                <img
                  src={photo.imageUrl}
                  alt={photo.description}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-semibold text-white line-clamp-2">{photo.description}</p>
                </div>
              </a>
            ))}
          </div>
          <Pagination {...photoPages} />
        </div>
      )}
    </div>
  );
}
