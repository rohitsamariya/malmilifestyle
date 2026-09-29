import Link from "next/link";
import ProductCarousel from "@/components/home/ProductCarousel";
import type { ProductListing } from "@/data/types";

/**
 * Renders the remainder of the active catalog — everything not already shown
 * in "Featured Products". Renders nothing when there is nothing left over, so
 * a single-category catalog does not get an empty section.
 */
export default async function ExploreMore({ listings }: { listings: ProductListing[] }) {
  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="explore-heading"
      className="border-y border-beige bg-cream-deep/50"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Keep Exploring
            </p>
            <h2
              id="explore-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Explore More From Malmi
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-full border border-forest/25 bg-white px-6 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
          >
            Shop All Products
          </Link>
        </div>

        <div className="mt-12">
          <ProductCarousel listings={listings} ariaLabel="More Malmi products" />
        </div>
      </div>
    </section>
  );
}
