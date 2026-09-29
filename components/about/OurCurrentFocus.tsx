import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface OurCurrentFocusProps {
  /** Number of base products in the focus category, derived from the DB. */
  productCount: number;
  /** Number of distinct pack sizes across the focus category, derived. */
  packSizeCount: number;
  /** Link to the active category listing. */
  shopHref: string;
}

/**
 * "Our Current Focus" — the brand's category in one compact, premium summary.
 * Counts are always derived from the live catalog, never hardcoded, so they
 * stay accurate when the inventory changes. No unsupported claims.
 */
export default function OurCurrentFocus({
  productCount,
  packSizeCount,
  shopHref,
}: OurCurrentFocusProps) {
  return (
    <section
      aria-labelledby="our-current-focus-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Our Current Focus
            </p>
            <h2
              id="our-current-focus-heading"
              className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Starting With Wood-Pressed Oils
            </h2>
            <p className="mt-4 text-base leading-relaxed text-earth-light">
              Our current collection brings together carefully selected oils,
              available in multiple pack sizes for everyday cooking.
            </p>
            <Link
              href={shopHref}
              className="mt-8 inline-flex h-[50px] items-center gap-2 rounded-full bg-forest px-7 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
            >
              Explore Wood-Pressed Oils
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-beige bg-white p-6">
              <span className="font-display text-5xl font-semibold leading-none text-forest">
                {productCount}
              </span>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-earth">
                Oils in the collection
              </p>
            </div>
            <div className="rounded-2xl border border-beige bg-white p-6">
              <span className="font-display text-5xl font-semibold leading-none text-forest">
                {packSizeCount}
              </span>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-earth">
                Pack sizes available
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}