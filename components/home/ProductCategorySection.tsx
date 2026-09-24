import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/data/types";
import type { Product } from "@/data/types";
import { getSellableListings } from "@/data/products";
import ProductCarousel from "@/components/home/ProductCarousel";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cn, productsHref } from "@/lib/utils";

interface ProductCategorySectionProps {
  category: Category;
  products: Product[];
  /** Wide category illustration shown above the carousel. */
  banner: string;
  /** Alternate section background so sections keep editorial rhythm. */
  tone?: "default" | "light";
}

/**
 * Dedicated ecommerce category section: heading + supporting copy, a large
 * full-width category visual, and the real catalog product carousel which
 * overlaps the banner for a premium, dense storefront feel.
 */
export default function ProductCategorySection({
  category,
  products,
  banner,
  tone = "default",
}: ProductCategorySectionProps) {
  const listings = getSellableListings(products);

  return (
    <section
      aria-labelledby={`${category.slug}-heading`}
      className={cn(tone === "light" ? "bg-white" : "bg-cream")}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              The Collection
            </p>
            <h2
              id={`${category.slug}-heading`}
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              {category.name}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-earth-light">
              {category.description}
            </p>
          </div>
          <Link
            href={productsHref({ category: category.slug })}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-forest/25 bg-white px-6 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
          >
            View Collection
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Large category visual */}
        <Link
          href={productsHref({ category: category.slug })}
          className="relative mt-8 block overflow-hidden rounded-2xl border border-sand/60 bg-cream-deep"
          aria-label={`Browse ${category.name}`}
        >
          <Image
            src={banner}
            alt={category.name}
            width={1200}
            height={800}
            unoptimized
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-[1.02] sm:aspect-[21/9] lg:aspect-[21/8]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-forest-deep/55 to-transparent"
          />
        </Link>

        {/* Products — overlap the banner on larger screens */}
        <div className="relative z-10 -mt-10 sm:-mt-16 lg:-mt-20">
          <ProductCarousel listings={listings} ariaLabel={`${category.name} products`} />
        </div>
      </div>
    </section>
  );
}