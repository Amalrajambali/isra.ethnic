"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getCatalogItems } from "@/lib/catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { Price } from "@/components/Price";
import { scrollToSectionTop } from "@/lib/utils";

// 4 per page: one row of 4 on desktop, a 2x2 grid on phones.
const ITEMS_PER_PAGE = 4;
const fallbackCatalog = PlaceHolderImages.filter((item) => item.id.startsWith("catalog-"));

export function CatalogGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const [catalogSource, setCatalogSource] = useState(fallbackCatalog);
  const isMobile = useIsMobile();
  const itemsPerPage = ITEMS_PER_PAGE;

  useEffect(() => {
    getCatalogItems()
      .then(setCatalogSource)
      .catch(() => setCatalogSource(fallbackCatalog));
  }, []);

  const catalogImages = useMemo(() => {
    return [...catalogSource].sort((a, b) => {
      const aNumber = Number.parseInt(a.id.replace("catalog-", ""), 10);
      const bNumber = Number.parseInt(b.id.replace("catalog-", ""), 10);

      if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
        return b.id.localeCompare(a.id);
      }

      return bNumber - aNumber;
    });
  }, [catalogSource]);

  const totalPages = Math.max(1, Math.ceil(catalogImages.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginatedCatalogImages = catalogImages.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Pagination buttons sit below the grid, so bring "The Signature Series" heading back into view.
  const goToPage = (nextPage: number) => {
    setCurrentPage(nextPage);
    scrollToSectionTop(topRef.current);
  };

  return (
    <div ref={topRef} className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {paginatedCatalogImages.map((imgData, idx) => {
          return (
            <div
              key={imgData.id}
              className="group space-y-4 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Image with overlay */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted border border-border/50">
                {imgData.imageUrl?.startsWith("http") ? (
                  <img
                    src={imgData.imageUrl}
                    alt={imgData.description}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={imgData.imageUrl || ""}
                    alt={imgData.description}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint={imgData.imageHint}
                  />
                )}

                {/* Overlay slides up on hover; touch screens can't hover, so there it is always shown. */}
                <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
                  <div
                    className="
                    translate-y-full group-hover:translate-y-0 [@media(hover:none)]:translate-y-0
                    transition-transform duration-500 ease-in-out
                    pointer-events-auto
                  "
                    style={{
                      background: "linear-gradient(to top, rgba(26,18,10,0.92) 0%, rgba(26,18,10,0.6) 60%, transparent 100%)",
                      padding: isMobile ? "1.5rem 0.625rem 0.625rem" : "2rem 1.25rem 1.25rem",
                    }}
                  >
                    <p
                      className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
                      style={{ color: "hsl(39 48% 75%)" }}
                    >
                      Interested in this design?
                    </p>
                    <button
                      onClick={() => openWhatsAppOrder(imgData.description, imgData.price)}
                      className="
                      flex items-center gap-1.5 sm:gap-2.5 w-full justify-center
                      px-2 sm:px-4 py-2 sm:py-2.5 rounded
                      text-xs sm:text-sm font-semibold tracking-wide
                      transition-all duration-200
                      active:scale-95
                      border
                    "
                      style={{
                        background: "linear-gradient(135deg, hsl(39 48% 56%), hsl(39 48% 44%))",
                        color: "hsl(36 33% 98%)",
                        borderColor: "hsl(39 48% 65% / 0.4)",
                        boxShadow: "0 2px 12px hsl(39 48% 40% / 0.35)",
                      }}
                    >
                      <WhatsAppIcon />
                      {imgData.price ? "Order Now & Check Sizes" : "View Price & Sizes"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card footer — clean, no button clutter */}
              <div className="space-y-1">
                <h3 className="font-headline text-base sm:text-xl text-foreground group-hover:text-primary transition-colors">
                  {imgData.description}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Designer Series</p>
                  <Price value={imgData.price} className="text-sm sm:text-base font-semibold text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, page - 1))}
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
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
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
