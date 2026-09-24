/**
 * data/db-products.ts
 *
 * Server-only async data access layer for products.
 * Uses MongoDB Atlas via Mongoose.
 *
 * IMPORTANT: Do NOT import this file from any Client Component.
 * Use data/products.ts (static sync helpers) for client-side code.
 */

import type { Product, ProductCategory, ProductListing } from "./types";
import { searchProducts, getProductBySlug, getSellableListings } from "./products";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";

function mapDocToProduct(doc: any): Product {
  return {
    id: doc.productId || doc.id,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    images: doc.images ?? [],
    variants: (doc.variants ?? [])
      .filter((v: any) => v.isActive !== false)
      .map((v: any) => ({
        id: v.variantId || v.id,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
      })),
    rating: doc.rating ?? null,
    reviewCount: doc.reviewCount ?? null,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice ?? null,
    badge: doc.badge ?? null,
    madeWith: doc.madeWith,
  };
}

/**
 * Fetches active products from MongoDB.
 * Falls back to static data if MONGODB_URI is unset or DB has no documents.
 */
export async function getDbProducts({
  category,
  query,
}: {
  category?: string;
  query?: string;
} = {}): Promise<Product[]> {
  if (!process.env.MONGODB_URI) {
    return searchProducts({ category, query });
  }

  try {
    await connectToDatabase();
    const filter: Record<string, any> = { isActive: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { "variants.size": { $regex: q, $options: "i" } },
      ];
    }

    const docs = await ProductModel.find(filter).lean();
    if (!docs || docs.length === 0) {
      return searchProducts({ category, query });
    }

    return docs.map(mapDocToProduct);
  } catch (error) {
    console.error("Error querying products from MongoDB:", error);
    return searchProducts({ category, query });
  }
}

/**
 * Fetches a single active product by slug from MongoDB.
 * Falls back to static data if not found or DB unavailable.
 */
export async function getDbProductBySlug(slug: string): Promise<Product | null> {
  if (!process.env.MONGODB_URI) {
    return getProductBySlug(slug) ?? null;
  }

  try {
    await connectToDatabase();
    const doc = await ProductModel.findOne({ slug, isActive: true }).lean();
    if (!doc) {
      return getProductBySlug(slug) ?? null;
    }
    return mapDocToProduct(doc);
  } catch (error) {
    console.error(`Error querying product [${slug}] from MongoDB:`, error);
    return null;
  }
}

export async function getDbAllListings(): Promise<ProductListing[]> {
  const productList = await getDbProducts();
  return getSellableListings(productList);
}

export async function getDbListingsByCategory(category: ProductCategory): Promise<ProductListing[]> {
  const productList = await getDbProducts({ category });
  return getSellableListings(productList);
}

export async function searchDbListings({
  category,
  query,
}: {
  category?: string;
  query?: string;
}): Promise<ProductListing[]> {
  const productList = await getDbProducts({ category, query });
  return getSellableListings(productList);
}
