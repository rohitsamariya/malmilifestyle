import type { QueryFilter } from "mongoose";
import type { Product, ProductCategory, ProductListing } from "./types";
import connectToDatabase from "@/lib/db";
import ProductModel, { type IProduct } from "@/models/Product";
import CategoryModel from "@/models/Category";

interface VariantDocumentLike {
  variantId?: string;
  id?: string;
  size?: string;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  isActive?: boolean;
  image?: string | null;
  imagePublicId?: string | null;
}

interface ProductDocumentLike {
  productId?: string;
  id?: string;
  name?: string;
  slug?: string;
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  description?: string;
  images?: string[];
  imagePublicId?: string | null;
  variants?: VariantDocumentLike[];
  rating?: number | null;
  reviewCount?: number | null;
  price?: number;
  compareAtPrice?: number | null;
  badge?: string | null;
  isActive?: boolean;
}

interface SampledProductDocument extends Omit<ProductDocumentLike, "variants"> {
  variants: VariantDocumentLike;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapVariant(variant: VariantDocumentLike, legacyImage: string | null) {
  return {
    id: variant.variantId || variant.id || "",
    size: variant.size || "",
    price: variant.price ?? null,
    compareAtPrice: variant.compareAtPrice ?? null,
    image: variant.image || legacyImage || null,
    imagePublicId: variant.imagePublicId || null,
    stock: Math.max(0, Number(variant.stock ?? 0)),
    isActive: variant.isActive !== false,
  };
}

export function mapProductDocument(
  doc: ProductDocumentLike,
  { includeInactiveVariants = false }: { includeInactiveVariants?: boolean } = {},
): Product {
  const legacyImage = Array.isArray(doc.images) ? doc.images.find(Boolean) || null : null;
  const sourceVariants = Array.isArray(doc.variants)
    ? doc.variants
    : doc.variants
      ? [doc.variants]
      : [];
  const variants = sourceVariants
    .filter((variant) => includeInactiveVariants || variant.isActive !== false)
    .map((variant) => mapVariant(variant, legacyImage));
  const prices = variants
    .map((variant) => variant.price)
    .filter((price): price is number => price !== null);
  const categorySlug = doc.categorySlug || doc.category || "";

  return {
    id: doc.productId || doc.id || "",
    productId: doc.productId || doc.id || "",
    name: doc.name || "",
    slug: doc.slug || "",
    category: categorySlug,
    categoryId: doc.categoryId || "",
    categorySlug,
    description: doc.description || "",
    variants,
    rating: doc.rating ?? null,
    reviewCount: doc.reviewCount ?? null,
    price: doc.price ?? (prices.length ? Math.min(...prices) : null),
    compareAtPrice:
      doc.compareAtPrice ??
      variants.find((variant) => variant.compareAtPrice !== null)?.compareAtPrice ??
      null,
    badge: doc.badge ?? null,
    isActive: doc.isActive !== false,
  };
}

function toListings(products: Product[]): ProductListing[] {
  return products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.isActive)
      .map((variant) => ({
        listingKey: `${product.id}__${variant.id}`,
        product,
        variant,
      })),
  );
}

async function getActiveCategorySlugs(category?: string): Promise<string[]> {
  const filter = category && category !== "all"
    ? {
        isActive: true,
        $or: [{ slug: category }, { categoryId: category }],
      }
    : { isActive: true };
  return CategoryModel.find(filter).distinct("slug");
}

export async function getDbProducts({
  category,
  query,
  includeInactive = false,
  includeInactiveVariants = false,
}: {
  category?: string;
  query?: string;
  includeInactive?: boolean;
  includeInactiveVariants?: boolean;
} = {}): Promise<Product[]> {
  await connectToDatabase();
  const activeCategorySlugs = await getActiveCategorySlugs(category);
  if (activeCategorySlugs.length === 0) return [];
  const conditions: Record<string, unknown>[] = [];

  if (!includeInactive) {
    conditions.push({ isActive: true });
  }

  conditions.push({
    $or: [
      { categorySlug: { $in: activeCategorySlugs } },
      { category: { $in: activeCategorySlugs } },
    ],
  });

  if (category && category !== "all") {
    conditions.push({
      $or: [{ categorySlug: category }, { category }],
    });
  }

  if (query?.trim()) {
    const pattern = new RegExp(escapeRegExp(query.trim()), "i");
    conditions.push({
      $or: [
        { name: pattern },
        { description: pattern },
        { categorySlug: pattern },
        { category: pattern },
        { "variants.size": pattern },
      ],
    });
  }

  const filter = (conditions.length ? { $and: conditions } : {}) as QueryFilter<IProduct>;
  const docs = await ProductModel.find(filter)
    .sort({ createdAt: 1, productId: 1 })
    .lean();

  return docs.map((doc) => mapProductDocument(doc, { includeInactiveVariants }));
}

export async function getDbProductBySlug(slug: string): Promise<Product | null> {
  await connectToDatabase();
  const activeCategorySlugs = await getActiveCategorySlugs();
  if (activeCategorySlugs.length === 0) return null;
  const doc = await ProductModel.findOne({
    slug,
    isActive: true,
    $or: [
      { categorySlug: { $in: activeCategorySlugs } },
      { category: { $in: activeCategorySlugs } },
    ],
  }).lean();
  return doc ? mapProductDocument(doc) : null;
}

export async function getDbProductById(
  id: string,
  {
    includeInactive = false,
    includeInactiveVariants = false,
  }: {
    includeInactive?: boolean;
    includeInactiveVariants?: boolean;
  } = {},
): Promise<Product | null> {
  await connectToDatabase();
  const filter = {
    $and: [
      { $or: [{ productId: id }, { slug: id }] },
      ...(includeInactive ? [] : [{ isActive: true }]),
    ],
  } as QueryFilter<IProduct>;
  if (!includeInactive) {
    const activeCategorySlugs = await getActiveCategorySlugs();
    if (activeCategorySlugs.length === 0) return null;
    (filter.$and as QueryFilter<IProduct>[]).push({
      $or: [
        { categorySlug: { $in: activeCategorySlugs } },
        { category: { $in: activeCategorySlugs } },
      ],
    } as QueryFilter<IProduct>);
  }
  const doc = await ProductModel.findOne(filter).lean();
  return doc ? mapProductDocument(doc, { includeInactiveVariants }) : null;
}

export async function getDbAllListings(): Promise<ProductListing[]> {
  return toListings(await getDbProducts());
}

export async function getDbFeaturedListings(limit = 8): Promise<ProductListing[]> {
  await connectToDatabase();
  const activeCategorySlugs = await getActiveCategorySlugs();
  if (activeCategorySlugs.length === 0) return [];

  const docs = await ProductModel.aggregate<SampledProductDocument>([
    {
      $match: {
        isActive: true,
        $or: [
          { categorySlug: { $in: activeCategorySlugs } },
          { category: { $in: activeCategorySlugs } },
        ],
      },
    },
    { $unwind: "$variants" },
    { $match: { "variants.isActive": true } },
    { $sample: { size: limit } },
  ]);

  return docs.map((doc) => {
    const product = mapProductDocument({
      ...doc,
      variants: [doc.variants],
    });
    const variant = product.variants[0];
    return {
      listingKey: `${product.id}__${variant.id}`,
      product,
      variant,
    };
  });
}

export async function getDbListingsByCategory(
  category: ProductCategory,
): Promise<ProductListing[]> {
  return toListings(await getDbProducts({ category }));
}

export async function searchDbListings({
  category,
  query,
}: {
  category?: string;
  query?: string;
}): Promise<ProductListing[]> {
  return toListings(await getDbProducts({ category, query }));
}
