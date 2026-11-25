"use client";

import { useEffect, useRef, useState } from "react";
import { PlaceHolderImages, type ImagePlaceholder } from "@/app/lib/placeholder-images";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { Price } from "@/components/Price";
import { Skeleton } from "@/components/ui/skeleton";
import { scrollToSectionTop } from "@/lib/utils";

const REELS_PER_PAGE = 6;
const PHOTOS_PER_PAGE = 8;
// Shown until a post has an admin or AI name; Instagram captions are never used as product names.
const DEFAULT_PRODUCT_NAME = "ISRA Ethnic Design";
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

// topRef goes on the section's container; changing page scrolls back up to that section's heading.
function usePagination<T>(items: T[], perPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(currentPage, totalPages);

  return {
    topRef,
    page,
    totalPages,
    pageItems: items.slice((page - 1) * perPage, page * perPage),
    setPage: (nextPage: number) => {
      setCurrentPage(nextPage);
      scrollToSectionTop(topRef.current);
    },
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

let feedRequest: Promise<InstagramFeedResponse | null> | null = null;

// Both sections (and the page loader) read the same feed, so share one request between them.
export function loadFeed(): Promise<InstagramFeedResponse | null> {
  feedRequest ??= fetch("/api/instagram")
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  return feedRequest;
}

// Starts empty with loading=true so the sections show skeletons, not sample posts that get swapped out.
function useInstagramFeed() {
  const [feed, setFeed] = useState({
    reels: [] as ImagePlaceholder[],
    photos: [] as ImagePlaceholder[],
    loading: true,
  });

  useEffect(() => {
    loadFeed().then((data) => {
      const live = data?.source === "instagram";
      setFeed({
        reels: live && data.reels?.length ? data.reels : fallbackReels,
        photos: live && data.photos?.length ? data.photos : fallbackPhotos,
        loading: false,
      });
    });
  }, []);

  return feed;
}

function PhotoSkeletons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" aria-label="Loading collection">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className={`flex flex-col gap-2 sm:gap-3 ${index >= 4 ? "hidden md:flex" : ""}`}>
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ReelSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" aria-label="Loading reels">
      {/* One placeholder per visible column: 1 on phones, 2 on tablets, 3 on desktop. */}
      {["", "hidden sm:block", "hidden md:block"].map((visibility, index) => (
        <Skeleton key={index} className={`aspect-[9/16] w-full rounded-2xl ${visibility}`} />
      ))}
    </div>
  );
}

function SectionHeading({ title, showFollow }: { title: string; showFollow?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Instagram className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
        <h2 className="font-headline text-2xl sm:text-3xl">{title}</h2>
      </div>
      {showFollow && (
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline font-bold tracking-widest text-xs sm:text-sm uppercase inline-block sm:whitespace-nowrap"
        >
          Follow @isra.ethnic
        </a>
      )}
    </div>
  );
}

export function InstagramReels() {
  const { reels, loading } = useInstagramFeed();
  const reelPages = usePagination(reels, REELS_PER_PAGE);

  return (
    <div ref={reelPages.topRef} className="space-y-6 sm:space-y-8">
      <SectionHeading title="Trending Reels" showFollow />
      {loading ? <ReelSkeletons /> : (
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
      )}
      {!loading && <Pagination page={reelPages.page} totalPages={reelPages.totalPages} setPage={reelPages.setPage} />}
    </div>
  );
}

export function InstagramPhotos({ id }: { id?: string }) {
  const { photos, loading } = useInstagramFeed();
  const photoPages = usePagination(photos, PHOTOS_PER_PAGE);

  if (!loading && !photos.length) return null;

  return (
    <section id={id} ref={photoPages.topRef} className="py-12 sm:py-24 space-y-6 sm:space-y-8">
      <SectionHeading title="Latest Collection" showFollow />
      {loading ? <PhotoSkeletons /> : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {photoPages.pageItems.map((photo) => (
          <div key={photo.id} className="group flex flex-col gap-2 sm:gap-3">
            <a
              href={photo.permalink || INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="block aspect-[4/5] relative overflow-hidden rounded-2xl bg-card border border-primary/10"
            >
              {/* Instagram CDN links are signed and expire, so load them directly instead of through next/image. */}
              <img
                src={photo.imageUrl}
                alt={photo.description || DEFAULT_PRODUCT_NAME}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </a>
            <p className="font-headline text-sm sm:text-base text-foreground line-clamp-2">
              {photo.description || DEFAULT_PRODUCT_NAME}
            </p>
            <Price value={photo.price} className="text-sm sm:text-base font-semibold text-primary" />
            <button
              type="button"
              onClick={() => openWhatsAppOrder(photo.description || DEFAULT_PRODUCT_NAME, photo.price, photo.permalink)}
              className="mt-auto flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-primary px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
            >
              <WhatsAppIcon />
              {photo.price ? "Order Now" : "Ask Price"}
            </button>
          </div>
        ))}
      </div>
      )}
      {!loading && <Pagination page={photoPages.page} totalPages={photoPages.totalPages} setPage={photoPages.setPage} />}
    </section>
  );
}
