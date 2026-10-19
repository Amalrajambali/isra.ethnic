"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlaceHolderImages, type ImagePlaceholder } from "@/app/lib/placeholder-images";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const fallbackFeed = PlaceHolderImages.filter((p) => p.id.startsWith("insta-")).sort((a, b) => {
  const aNumber = Number.parseInt(a.id.replace("insta-", ""), 10);
  const bNumber = Number.parseInt(b.id.replace("insta-", ""), 10);

  if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
    return b.id.localeCompare(a.id);
  }

  return bNumber - aNumber;
});

export function InstagramFeed() {
  const [currentPage, setCurrentPage] = useState(1);
  const [instaImages, setInstaImages] = useState<ImagePlaceholder[]>(fallbackFeed);

  useEffect(() => {
    fetch("/api/instagram")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items: ImagePlaceholder[]) => items.length && setInstaImages(items))
      .catch(() => setInstaImages(fallbackFeed));
  }, []);

  const totalPages = Math.ceil(instaImages.length / ITEMS_PER_PAGE);
  const paginatedInstaImages = instaImages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const buildInstagramEmbedUrl = (reelUrl: string) => {
    const url = new URL(reelUrl);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path}/embed/`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Instagram className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
          <h2 className="font-headline text-2xl sm:text-3xl">Trending Reels</h2>
        </div>
        <a
          href="https://www.instagram.com/isra.ethnic?igsh=dnhtNHQ5dGlwdmcw"
          target="_blank"
          className="text-primary hover:underline font-bold tracking-widest text-xs sm:text-sm uppercase inline-block sm:whitespace-nowrap"
        >
          Follow @isra.ethnic
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {paginatedInstaImages.map((img) => {
          if (img.reelUrl) {
            const embedUrl = buildInstagramEmbedUrl(img.reelUrl);
            return (
              <div
                key={img.id}
                className="aspect-[9/16] relative overflow-hidden rounded-2xl bg-card border border-primary/10"
              >
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                  allow="encrypted-media"
                  title={img.description}
                />
              </div>
            );
          }

          return (
            <a
              key={img.id}
              href={img.permalink || "https://www.instagram.com/isra.ethnic"}
              target="_blank"
              rel="noreferrer"
              className="block aspect-[9/16] relative group overflow-hidden rounded-2xl bg-card border border-primary/10"
            >
              <Image
                src={img.imageUrl || ""}
                alt={img.description}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-bold text-white/80 line-clamp-2 bg-black/50 backdrop-blur-sm p-2 rounded-lg">
                  {img.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
