import type { ProductCategory, CategorySlug } from "@/data/types";
import { getCategory } from "@/data/categories";
import {
  getDbAllListings,
  getDbListingsByCategory,
  searchDbListings,
} from "@/data/db-products";
import Breadcrumb from "@/components/products/Breadcrumb";
import CategoryTabs from "@/components/products/CategoryTabs";
import ProductBrowser from "@/components/products/ProductBrowser";
import Link from "next/link";

interface ProductListingPageProps {
  category?: CategorySlug;
  query?: string;
}

/**
 * Shared server component for all listing pages.
 * Expands products into per-variant sellable listings.
 * Shows a search-results heading when a query is active.
 */
export default async function ProductListingPage({
  category = "all",
  query,
}: ProductListingPageProps) {
  const active = getCategory(category);
  const isAll = active.slug === "all";
  const trimmedQuery = query?.trim() || undefined;

  const listings = trimmedQuery
    ? await searchDbListings({ category: active.slug, query: trimmedQuery })
    : isAll
      ? await getDbAllListings()
      : await getDbListingsByCategory(active.slug as ProductCategory);

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Home", href: "/" },
    { label: "Products", href: isAll && !trimmedQuery ? undefined : "/products" },
  ];
  if (!isAll) crumbs.push({ label: active.name });
  if (trimmedQuery) crumbs.push({ label: `"${trimmedQuery}"` });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumb items={crumbs} />

      <header className="mt-6 max-w-2xl">
        {trimmedQuery ? (
          <>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Search Results
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-forest sm:text-[3.25rem]">
              &ldquo;{trimmedQuery}&rdquo;
            </h1>
            <p className="mt-2 text-sm font-semibold text-forest/80">
              {listings.length} {listings.length === 1 ? "Product" : "Products"} found
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              {isAll ? "The Full Collection" : "The Collection"}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-forest sm:text-[3.25rem]">
              {isAll ? "All Products" : active.name}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              {isAll
                ? "Explore the complete Malmi Lifestyle collection."
                : active.description}
            </p>
            <p className="mt-2 text-sm font-semibold text-forest/80">
              {listings.length} {listings.length === 1 ? "SKU" : "SKUs"}
            </p>
          </>
        )}
      </header>

      {/* Empty search state */}
      {trimmedQuery && listings.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-base font-medium text-earth-light">
            No products found matching &ldquo;{trimmedQuery}&rdquo;
          </p>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-xl bg-forest px-6 text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30]"
          >
            View All Products
          </Link>
        </div>
      )}

      {/* Category tabs — hidden in search mode */}
      {!trimmedQuery && (
        <div className="mt-8 border-b border-beige pb-4">
          <CategoryTabs activeCategory={active.slug} />
        </div>
      )}

      {listings.length > 0 && <ProductBrowser listings={listings} query={trimmedQuery} />}
    </div>
  );
}