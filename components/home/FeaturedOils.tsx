import Link from "next/link";
import ProductCarousel from "@/components/home/ProductCarousel";
import type { ProductListing } from "@/data/types";

/**
 * Featured Products — sellable variants shown as individual cards via the existing
 * variant expansion (each `ProductListing` is one product + one size).
 *
 * Desktop shows 5 cards, tablet 3, mobile 2, with the carousel controls
 * aligned bottom-right. Renders nothing when the catalog has no active
 * listings, so deactivating the category removes the whole section.
 */
export default function FeaturedOils({ listings }: { listings: ProductListing[] }) {
  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-oils-heading"
      className="border-b border-beige bg-cream-deep/50"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              From The Collection
            </p>
            <h2
              id="featured-oils-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Featured Products
            </h2>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              Discover some of our carefully selected products.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-full border border-forest/25 bg-white px-6 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
          >
            View All Products
          </Link>
        </div>

        <div className="mt-12">
          <ProductCarousel listings={listings} ariaLabel="Featured oils" />
        </div>
      </div>
    </section>
  );
}
