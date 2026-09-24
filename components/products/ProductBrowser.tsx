"use client";

import { useMemo, useState } from "react";
import type { ProductListing } from "@/data/types";
import ProductGrid from "@/components/products/ProductGrid";
import ProductToolbar, { type SortKey } from "@/components/products/ProductToolbar";

interface ProductBrowserProps {
  listings: ProductListing[];
  query?: string;
}

function sortListings(list: ProductListing[], sort: SortKey): ProductListing[] {
  if (sort === "name-asc") {
    return [...list].sort((a, b) =>
      `${a.product.name} ${a.variant.size}`.localeCompare(
        `${b.product.name} ${b.variant.size}`,
      ),
    );
  }
  if (sort === "name-desc") {
    return [...list].sort((a, b) =>
      `${b.product.name} ${b.variant.size}`.localeCompare(
        `${a.product.name} ${a.variant.size}`,
      ),
    );
  }
  if (sort === "price-asc") {
    return [...list].sort(
      (a, b) => (a.variant.price ?? 0) - (b.variant.price ?? 0),
    );
  }
  if (sort === "price-desc") {
    return [...list].sort(
      (a, b) => (b.variant.price ?? 0) - (a.variant.price ?? 0),
    );
  }
  return list;
}

/** Client-side listing browser: toolbar (count + sort) above the grid. */
export default function ProductBrowser({ listings, query }: ProductBrowserProps) {
  const [sort, setSort] = useState<SortKey>("featured");
  const sorted = useMemo(() => sortListings(listings, sort), [listings, sort]);

  return (
    <div className="mt-8 flex flex-col gap-5">
      <ProductToolbar count={listings.length} sort={sort} onSortChange={setSort} />
      <ProductGrid listings={sorted} query={query} />
    </div>
  );
}