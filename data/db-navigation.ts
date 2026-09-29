/**
 * Navigation read model.
 *
 * Returns the active categories together with their active *base* products so
 * the navbar can build a category dropdown without hardcoding the catalog. The
 * list is derived from MongoDB every time, so activating another category later
 * makes it appear with no code change.
 *
 * Visibility honours all three levels, in the same order as the storefront:
 * an inactive category is never returned, an inactive product is never
 * returned, and a product is only returned when it still has at least one
 * active variant — otherwise the dropdown would link to a detail page with
 * nothing to buy.
 */

import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import { getDbCategories } from "./db-categories";
import type { Category } from "./types";

/** A base product as the navbar needs it. Variants are deliberately excluded. */
export interface NavProduct {
  name: string;
  slug: string;
}

export interface NavCategory extends Category {
  products: NavProduct[];
}

interface ProductRow {
  name?: string;
  slug?: string;
  category?: string;
  categorySlug?: string;
}

export async function getDbNavigation(): Promise<NavCategory[]> {
  const categories = await getDbCategories();
  if (categories.length === 0) return [];

  await connectToDatabase();
  const slugs = categories.map((category) => category.slug);

  const products = await ProductModel.find({
    isActive: true,
    $or: [{ categorySlug: { $in: slugs } }, { category: { $in: slugs } }],
    variants: { $elemMatch: { isActive: true } },
  })
    .select({ name: 1, slug: 1, categorySlug: 1, category: 1 })
    .sort({ name: 1 })
    .lean<ProductRow[]>();

  const bySlug = new Map<string, NavProduct[]>();
  for (const product of products) {
    if (!product.name || !product.slug) continue;
    const categorySlug = [product.categorySlug, product.category].find((value) =>
      slugs.includes(value ?? ""),
    );
    if (!categorySlug) continue;
    const list = bySlug.get(categorySlug) ?? [];
    list.push({ name: product.name, slug: product.slug });
    bySlug.set(categorySlug, list);
  }

  return categories.map((category) => ({
    ...category,
    products: bySlug.get(category.slug) ?? [],
  }));
}
