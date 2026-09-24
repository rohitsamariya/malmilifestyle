import Link from "next/link";
import type { ProductListing } from "@/data/types";
import ProductCard from "@/components/products/ProductCard";
import { SearchIcon } from "@/components/ui/icons";

interface ProductGridProps {
  listings: ProductListing[];
  query?: string;
}

/**
 * Dense premium ecommerce grid.
 * 2 cols mobile → 3 tablet → 4 desktop → 5 large desktop.
 * Each cell renders one ProductListing (product + single variant).
 */
export default function ProductGrid({ listings, query }: ProductGridProps) {
  if (listings.length === 0) {
    return (
      <div
        aria-label="No products"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-beige bg-cream px-6 py-20 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-beige text-earth">
          <SearchIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-forest">
          No products found
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-earth-light">
          {query ? (
            <>
              Nothing matched &ldquo;<span className="font-medium text-forest">{query}</span>
              &rdquo;. Try a different term.
            </>
          ) : (
            "This collection is empty right now. Please check back soon."
          )}
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-forest px-6 text-sm font-semibold text-cream transition-colors hover:bg-forest-soft"
        >
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-2.5 gap-y-5 md:grid-cols-3 md:gap-x-3.5 lg:grid-cols-4 lg:gap-x-4 xl:grid-cols-5 xl:gap-x-5">
      {listings.map((listing) => (
        <li key={listing.listingKey}>
          <ProductCard listing={listing} />
        </li>
      ))}
    </ul>
  );
}