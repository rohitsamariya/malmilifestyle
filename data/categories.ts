import type { Category, CategorySlug } from "./types";

export const ALL_PRODUCTS_CATEGORY: Category = {
  slug: "all",
  name: "All Products",
  shortName: "All",
  description: "Everything from Malmi under one roof.",
};

/**
 * Flat category catalog for Malmi Lifestyle.
 * The Malmi catalog has EXACTLY 4 categories — each item maps 1:1 to a URL route.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "wood-pressed-oils",
    name: "Wood-Pressed Oils",
    shortName: "Oils",
    description:
      "Cold-pressed oils extracted the traditional way, without heat or chemicals.",
  },
  {
    slug: "wheat-atta",
    name: "Wheat Atta",
    shortName: "Wheat Atta",
    description: "Stone-ground wheat flours, milled the traditional way.",
  },
  {
    slug: "multigrain-atta",
    name: "Multigrain Atta",
    shortName: "Multigrain",
    description: "Stone-ground multigrain blends for everyday nutrition.",
  },
  {
    slug: "millet-atta",
    name: "Millet Atta",
    shortName: "Millet",
    description: "Stone-ground millet and traditional flours.",
  },
];

export const ALL_TABS: Category[] = [ALL_PRODUCTS_CATEGORY, ...CATEGORIES];

export function getCategory(slug: string | undefined): Category {
  if (!slug || slug === "all") return ALL_PRODUCTS_CATEGORY;
  return CATEGORIES.find((c) => c.slug === slug) ?? ALL_PRODUCTS_CATEGORY;
}

export function isKnownCategory(slug: string | undefined): boolean {
  return slug === "all" || CATEGORIES.some((c) => c.slug === slug);
}

/** Recognised slugs that can legitimately filter the grid. */
export const CATEGORY_SLUGS: CategorySlug[] = [
  "all",
  ...CATEGORIES.map((c) => c.slug),
];

/** Maps a category slug to the products.filter() key. */
export function filterKey(slug: CategorySlug) {
  return slug === "all" ? undefined : slug;
}