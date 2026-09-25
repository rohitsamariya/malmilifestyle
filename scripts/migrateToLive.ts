import * as dotenv from "dotenv";
import Category from "../models/Category";
import Product from "../models/Product";
import { createIsolatedDatabaseConnection, LOCAL_MONGODB_URI } from "../lib/db";

dotenv.config();
dotenv.config({ path: ".env.local" });

function databaseLocation(uri: string): string {
  try {
    const url = new URL(uri);
    return `${url.protocol}//${url.hostname}:${url.port || "27017"}${url.pathname}`;
  } catch {
    return "invalid-uri";
  }
}

function withoutMongoInternals(value: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...data } = value;
  void _id;
  void __v;
  return data;
}

function normalizeProductData(value: Record<string, unknown>): Record<string, unknown> {
  const data = withoutMongoInternals(value);
  const legacyImage = Array.isArray(data.images)
    ? data.images.find((image): image is string => typeof image === "string" && Boolean(image)) || null
    : null;
  const { images, imagePublicId, madeWith, ...clean } = data;
  void images;
  void imagePublicId;
  void madeWith;
  const variants = Array.isArray(clean.variants) ? clean.variants : [];
  return {
    ...clean,
    variants: variants.map((variant) => {
      if (!variant || typeof variant !== "object" || Array.isArray(variant)) return variant;
      const record = variant as Record<string, unknown>;
      return {
        ...record,
        image: typeof record.image === "string" && record.image ? record.image : legacyImage,
        imagePublicId: typeof record.imagePublicId === "string" ? record.imagePublicId : null,
      };
    }),
  };
}

export async function migrateToLive(): Promise<void> {
  const localUri = process.env.LOCAL_MONGODB_URI || LOCAL_MONGODB_URI;
  const liveUri = process.env.LIVE_MONGODB_URI;
  if (!liveUri) {
    throw new Error("LIVE_MONGODB_URI is required. Set it before running the migration.");
  }
  if (databaseLocation(localUri) === databaseLocation(liveUri)) {
    throw new Error("LOCAL_MONGODB_URI and LIVE_MONGODB_URI must point to different databases.");
  }

  let localConnection: Awaited<ReturnType<typeof createIsolatedDatabaseConnection>> | null = null;
  let liveConnection: Awaited<ReturnType<typeof createIsolatedDatabaseConnection>> | null = null;

  try {
    localConnection = await createIsolatedDatabaseConnection(localUri);
    const LocalCategory = localConnection.model("MigrationCategory", Category.schema);
    const LocalProduct = localConnection.model("MigrationProduct", Product.schema);
    const localCategories = await LocalCategory.find({}).lean();
    const localProducts = await LocalProduct.find({}).lean();

    liveConnection = await createIsolatedDatabaseConnection(liveUri);
    const LiveCategory = liveConnection.model("MigrationCategory", Category.schema);
    const LiveProduct = liveConnection.model("MigrationProduct", Product.schema);

    let categoryUpserts = 0;
    for (const category of localCategories) {
      const data = withoutMongoInternals(category as Record<string, unknown>);
      const categoryId = typeof data.categoryId === "string" ? data.categoryId : undefined;
      const slug = typeof data.slug === "string" ? data.slug : undefined;
      if (!categoryId && !slug) continue;
      await LiveCategory.findOneAndUpdate(
        { $or: [{ categoryId }, { slug }].filter((value) => value) },
        { $set: data },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
      );
      categoryUpserts += 1;
    }

    let productUpserts = 0;
    for (const product of localProducts) {
      const data = normalizeProductData(product as Record<string, unknown>);
      const productId = typeof data.productId === "string" ? data.productId : undefined;
      const slug = typeof data.slug === "string" ? data.slug : undefined;
      if (!productId && !slug) continue;
      await LiveProduct.findOneAndUpdate(
        { $or: [{ productId }, { slug }].filter((value) => value) },
        { $set: data, $unset: { images: 1, imagePublicId: 1, madeWith: 1 } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true, strict: false },
      );
      productUpserts += 1;
    }

    console.log(`Migrated ${categoryUpserts} categories and ${productUpserts} products to the live database.`);
  } finally {
    if (localConnection && localConnection.readyState !== 0) {
      await localConnection.close();
    }
    if (liveConnection && liveConnection.readyState !== 0) {
      await liveConnection.close();
    }
  }
}

if (require.main === module) {
  migrateToLive()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error("Migration failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
