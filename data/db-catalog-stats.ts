import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";

export interface CatalogStat {
  value: number;
  label: string;
}

export interface CategoryCatalogStat {
  slug: string;
  name: string;
  shortName: string;
  /** Active products in the category. */
  products: number;
  /** Active variants in the category — the number of cards customers actually see. */
  listings: number;
}

export interface CatalogStats {
  totalProducts: number;
  totalListings: number;
  perCategory: CategoryCatalogStat[];
}

interface AggregateRow {
  _id: string;
  listings: number;
  products: string[];
}

/**
 * Homepage headline numbers, read from the database.
 *
 * Only active categories contribute, and a category is counted only when it
 * has active products with active variants — so the numbers a customer sees
 * always match the catalog they can actually browse, and a section that has
 * been deactivated drops out of the strip on its own.
 */
export async function getDbCatalogStats(): Promise<CatalogStats> {
  await connectToDatabase();

  const activeCategories = await CategoryModel.find({ isActive: true })
    .select({ slug: 1, name: 1, shortName: 1 })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  if (activeCategories.length === 0) {
    return { totalProducts: 0, totalListings: 0, perCategory: [] };
  }

  const slugs = activeCategories.map((category) => category.slug);
  const rows = await ProductModel.aggregate<AggregateRow>([
    {
      $match: {
        isActive: true,
        $or: [{ categorySlug: { $in: slugs } }, { category: { $in: slugs } }],
      },
    },
    { $unwind: "$variants" },
    { $match: { "variants.isActive": true } },
    {
      $group: {
        _id: { $ifNull: ["$categorySlug", "$category"] },
        listings: { $sum: 1 },
        products: { $addToSet: "$productId" },
      },
    },
  ]);

  const bySlug = new Map(rows.map((row) => [row._id, row]));

  const perCategory: CategoryCatalogStat[] = activeCategories.map((category) => {
    const row = bySlug.get(category.slug);
    return {
      slug: category.slug,
      name: category.name,
      shortName: category.shortName || category.name,
      products: row ? row.products.length : 0,
      listings: row ? row.listings : 0,
    };
  });

  const visible = perCategory.filter((category) => category.listings > 0);

  return {
    totalProducts: visible.reduce((sum, category) => sum + category.products, 0),
    totalListings: visible.reduce((sum, category) => sum + category.listings, 0),
    perCategory: visible,
  };
}

/**
 * Formats the stats strip. Returns `[]` when there is nothing to show.
 *
 * The totals are recomputed from `perCategory` rather than trusted from the
 * caller, so the strip can never show a product count for a category that has
 * already dropped out of the visible catalog.
 */
export function toHomepageStats(stats: CatalogStats): CatalogStat[] {
  const visible = stats.perCategory.filter((category) => category.listings > 0);
  if (visible.length === 0) return [];

  const result: CatalogStat[] = visible.map((category) => ({
    value: category.products,
    label: category.shortName,
  }));

  const totalListings = visible.reduce((sum, category) => sum + category.listings, 0);
  if (totalListings > 0) {
    result.push({ value: totalListings, label: "Products available" });
  }

  return result;
}
