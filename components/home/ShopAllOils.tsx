import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { ProductListing } from "@/data/types";

interface ShopAllOilsProps {
  listings: ProductListing[];
  /** Active category slug, e.g. wood-pressed-oils. */
  categorySlug: string;
  /** Human category name; kept so category copy stays data-driven. */
  categoryName: string;
}

/**
 * Main catalogue section: every sellable variant in the active category as its
 * own card, from the same DB-driven expansion the listing page uses. Nothing
 * is hardcoded and nothing is invented — the count follows the database.
 */
export default function ShopAllOils({
  listings,
  categorySlug,
}: ShopAllOilsProps) {
  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="shop-all-oils-heading"
      className="border-b border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              The Collection
            </p>
            <h2
              id="shop-all-oils-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Shop All Products
            </h2>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              Explore our complete collection and available sizes.
            </p>
          </div>

          <Link
            href={`/products/${categorySlug}`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
          >
            View All Products
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12">
          <ProductGrid listings={listings} />
        </div>
      </div>
    </section>
  );
}
