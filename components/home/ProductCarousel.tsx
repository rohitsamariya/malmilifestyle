"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductListing } from "@/data/types";
import ProductCard from "@/components/products/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface ProductCarouselProps {
  listings: ProductListing[];
  ariaLabel: string;
  className?: string;
}

/**
 * Horizontal carousel of ProductListing cards.
 * Desktop 5 cards / tablet 3 / mobile 2. Touch-swipe + snap.
 */
export default function ProductCarousel({
  listings,
  ariaLabel,
  className,
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateArrows() {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [listings]);

  function scrollBy(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div role="region" aria-label={ariaLabel} className={cn("relative", className)}>
      {/* Scrollable Product Track — native scrollbar hidden */}
      <div
        ref={trackRef}
        className="scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {listings.map((listing) => (
          <div
            key={listing.listingKey}
            className="w-[calc((100%_-_1.25rem)/2)] shrink-0 snap-start sm:w-[calc((100%_-_2.5rem)/3)] lg:w-[calc((100%_-_5rem)/5)]"
          >
            <ProductCard listing={listing} />
          </div>
        ))}
      </div>

      {/* Bottom Carousel Controls */}
      <div className="mt-5 flex items-center justify-end gap-3 sm:mt-6">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canPrev}
          aria-label={`Scroll ${ariaLabel} left`}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 shadow-sm",
            canPrev
              ? "border-sand bg-white text-forest hover:border-forest hover:bg-forest hover:text-cream hover:shadow-md active:scale-95"
              : "cursor-not-allowed border-beige/60 bg-cream/50 text-earth-lighter opacity-40",
          )}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canNext}
          aria-label={`Scroll ${ariaLabel} right`}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 shadow-sm",
            canNext
              ? "border-sand bg-white text-forest hover:border-forest hover:bg-forest hover:text-cream hover:shadow-md active:scale-95"
              : "cursor-not-allowed border-beige/60 bg-cream/50 text-earth-lighter opacity-40",
          )}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}