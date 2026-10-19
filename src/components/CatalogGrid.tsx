"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { getCatalogItems } from "@/lib/catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const WHATSAPP_NUMBER = "918113081120";
const ITEMS_PER_PAGE_DESKTOP = 3;
const ITEMS_PER_PAGE_MOBILE = 2;
const fallbackCatalog = PlaceHolderImages.filter((item) => item.id.startsWith("catalog-"));

function formatPrice(price?: string | number | null) {
  if (!price) return "Price on request";
  const value = String(price).trim();
  return value.startsWith("Rs.") ? value : `Rs.${value}`;
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
    >
      <path d="M12.04 2c-5.52 0-10 4.36-10 9.74 0 1.94.59 3.84 1.7 5.48L2 22l4.94-1.59c1.57.87 3.36 1.32 5.1 1.32h.01c5.52 0 10-4.36 10-9.74C22.05 6.36 17.57 2 12.04 2Zm0 17.65c-1.54 0-3.06-.41-4.41-1.19l-.32-.19-2.93.94.96-2.82-.21-.34a7.93 7.93 0 0 1-1.24-4.23c0-4.44 3.72-8.05 8.3-8.05 4.58 0 8.3 3.61 8.3 8.05 0 4.45-3.72 8.03-8.3 8.03Zm4.55-5.77c-.25-.12-1.47-.71-1.7-.8-.23-.09-.39-.12-.55.12-.16.23-.63.8-.77.96-.14.16-.28.18-.53.06-.25-.12-1.06-.38-2.02-1.22-.75-.66-1.25-1.48-1.4-1.73-.15-.25-.02-.38.1-.5.1-.1.25-.28.38-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.31-.75-1.79-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.8-.84 1.95 0 1.16.86 2.28.98 2.44.12.16 1.68 2.57 4.07 3.6.57.24 1.01.39 1.36.5.57.18 1.09.15 1.5.09.46-.07 1.47-.6 1.68-1.17.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function CatalogGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const [catalogSource, setCatalogSource] = useState(fallbackCatalog);
  const isMobile = useIsMobile();
  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;

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

  const handleWhatsApp = (dressName: string, price?: string | number | null) => {
    const message = encodeURIComponent(
      `👗 Interested in this design!\n\n*${dressName}*${price ? `\nPrice: ${formatPrice(price)}` : ""}\n\nCan you confirm available sizes?\n\n🛍️ ISRA Ethnic - Tirur, Kerala`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
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

                {/* Hover overlay — slides up from bottom */}
                <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
                  <div
                    className="
                    translate-y-full group-hover:translate-y-0
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
                      onClick={() => handleWhatsApp(imgData.description, imgData.price)}
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
                  <p className="text-sm sm:text-base font-semibold text-primary">
                    {formatPrice(imgData.price)}
                  </p>
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
            onClick={() => setCurrentPage(Math.max(1, page - 1))}
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
            onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
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
