"use client";

import { useEffect, useState } from "react";

export interface FooterProduct {
  name: string;
  slug: string;
}

interface ApiVariant {
  isActive?: boolean;
}

interface ApiProduct {
  name?: string;
  slug?: string;
  variants?: ApiVariant[];
}

/**
 * Customer-visible base products for the footer's Shop column, derived from
 * the live catalog. Only active products in active categories with at least
 * one active variant are returned — never an inactive category, product or a
 * product with nothing to buy — so the links stay in sync with the database
 * without hardcoding slugs.
 */
export default function useCatalogProducts(): FooterProduct[] {
  const [products, setProducts] = useState<FooterProduct[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        if (!Array.isArray(data.products)) return [];
        return data.products
          .filter(
            (product: ApiProduct) =>
              product?.name &&
              product?.slug &&
              Array.isArray(product.variants) &&
              product.variants.some((variant) => variant.isActive !== false),
          )
          .map((product: ApiProduct) => ({
            name: product.name as string,
            slug: product.slug as string,
          }));
      })
      .then((value: FooterProduct[]) => {
        if (active) setProducts(value);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return products;
}