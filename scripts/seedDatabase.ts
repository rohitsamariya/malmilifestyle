import mongoose from "mongoose";
import { getProducts } from "../data/products";
import Product from "../models/Product";

/**
 * Database Seed Script for Malmi Lifestyle.
 * Reads the 19 base products from data/products.ts and seeds them into MongoDB Atlas.
 * Idempotent upsert logic — safe to execute multiple times without producing duplicate entries.
 */
export async function seedProducts(): Promise<{
  total: number;
  upserted: number;
  modified: number;
}> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is missing. Please set MONGODB_URI in your environment."
    );
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  const products = getProducts();
  let upsertedCount = 0;
  let modifiedCount = 0;

  for (const item of products) {
    const docData = {
      productId: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category,
      description: item.description,
      images: item.images,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price ?? item.variants[0]?.price ?? 0,
      compareAtPrice: item.compareAtPrice ?? item.variants[0]?.compareAtPrice ?? null,
      badge: item.badge,
      madeWith: item.madeWith,
      isActive: true,
      variants: item.variants.map((v) => ({
        variantId: v.id,
        size: v.size,
        price: v.price ?? item.price ?? 0,
        compareAtPrice: v.compareAtPrice ?? item.compareAtPrice ?? null,
        stock: 100,
        isActive: true,
      })),
    };

    const res = await Product.findOneAndUpdate(
      { slug: item.slug },
      { $set: docData },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    );

    if (res.lastErrorObject?.updatedExisting) {
      modifiedCount++;
    } else {
      upsertedCount++;
    }
  }

  return {
    total: products.length,
    upserted: upsertedCount,
    modified: modifiedCount,
  };
}

// Allow direct CLI execution if executed directly
if (require.main === module) {
  seedProducts()
    .then((stats) => {
      console.log("Database Seed Successful!");
      console.log(`- Total products processed: ${stats.total}`);
      console.log(`- New products inserted: ${stats.upserted}`);
      console.log(`- Existing products updated: ${stats.modified}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database Seed Failed:", err);
      process.exit(1);
    });
}
