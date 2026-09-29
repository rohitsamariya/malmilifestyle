import { nanoid } from "nanoid";
import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";
import { deleteManagedProductAsset } from "@/lib/cloudinary-assets";
import { parseProductInput } from "@/lib/catalog-validation";

export class CatalogRequestError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status = 400, errors: string[] = []) {
    super(message);
    this.name = "CatalogRequestError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function referenceFromBody(
  body: Record<string, unknown>,
  fallback?: { categoryId?: string; categorySlug?: string; category?: string },
) {
  const slug =
    (typeof body.categorySlug === "string" && body.categorySlug.trim()) ||
    (typeof body.category === "string" && body.category.trim()) ||
    fallback?.categorySlug ||
    fallback?.category;
  const categoryId =
    (typeof body.categoryId === "string" && body.categoryId.trim()) ||
    fallback?.categoryId;
  const clauses: Record<string, string>[] = [];
  if (slug) clauses.push({ slug });
  if (categoryId) clauses.push({ categoryId });
  if (clauses.length === 0) return null;
  return { $or: clauses };
}

async function resolveCategory(
  body: Record<string, unknown>,
  fallback?: { categoryId?: string; categorySlug?: string; category?: string },
) {
  await connectToDatabase();
  const reference = referenceFromBody(body, fallback);
  if (!reference) {
    throw new CatalogRequestError("A valid category is required.");
  }
  const category = await CategoryModel.findOne(reference).lean();
  if (!category) {
    throw new CatalogRequestError("The selected category does not exist.");
  }
  return category;
}

function productFields(parsed: ReturnType<typeof parseProductInput>, category: {
  categoryId: string;
  slug: string;
}) {
  return {
    name: parsed.name,
    slug: parsed.slug,
    categoryId: category.categoryId || `cat-${category.slug}`,
    categorySlug: category.slug,
    category: category.slug,
    description: parsed.description,
    variants: parsed.variants,
    price: parsed.price,
    compareAtPrice: parsed.compareAtPrice,
    badge: parsed.badge,
    isActive: parsed.isActive,
  };
}

export async function createProduct(value: unknown) {
  if (!isRecord(value)) {
    throw new CatalogRequestError("Request body must be an object.");
  }
  const category = await resolveCategory(value);
  const parsed = parseProductInput(value);
  if (parsed.errors.length) {
    throw new CatalogRequestError(parsed.errors.join(" "), 400, parsed.errors);
  }

  const duplicate = await ProductModel.findOne({
    $or: [{ slug: parsed.slug }, { productId: value.productId ? String(value.productId) : "__new__" }],
  }).lean();
  if (duplicate) {
    throw new CatalogRequestError("A product with this slug or product ID already exists.", 409);
  }

  const product = await ProductModel.create({
    productId: typeof value.productId === "string" && value.productId.trim()
      ? value.productId.trim()
      : `p-${nanoid(10)}`,
    ...productFields(parsed, category),
  });
  return product.toObject();
}

async function deleteRemovedVariantAssets(
  previousVariants: Array<{ variantId?: string; imagePublicId?: string | null }>,
  nextVariants: Array<{ variantId?: string; imagePublicId?: string | null }>,
): Promise<void> {
  const nextById = new Map(nextVariants.map((variant) => [variant.variantId, variant]));
  for (const previous of previousVariants) {
    if (!previous.variantId || !previous.imagePublicId) continue;
    const next = nextById.get(previous.variantId);
    if (next?.imagePublicId === previous.imagePublicId) continue;
    try {
      await deleteManagedProductAsset(previous.imagePublicId);
    } catch (error) {
      console.error("Failed to delete replaced Cloudinary asset:", error);
    }
  }
}

export async function deleteProductVariantAssets(
  variants: Array<{ imagePublicId?: string | null }>,
): Promise<void> {
  for (const variant of variants) {
    if (!variant.imagePublicId) continue;
    try {
      await deleteManagedProductAsset(variant.imagePublicId);
    } catch (error) {
      console.error("Failed to delete product Cloudinary asset:", error);
    }
  }
}

export async function updateProduct(id: string, value: unknown) {
  if (!isRecord(value)) {
    throw new CatalogRequestError("Request body must be an object.");
  }

  await connectToDatabase();
  const existing = await ProductModel.findOne({
    $or: [{ productId: id }, { slug: id }],
  }).lean();
  if (!existing) {
    throw new CatalogRequestError("Product not found.", 404);
  }

  const category = await resolveCategory(value, existing);
  const merged = {
    ...existing,
    ...value,
    variants: value.variants ?? existing.variants,
  };
  const parsed = parseProductInput(merged);
  if (parsed.errors.length) {
    throw new CatalogRequestError(parsed.errors.join(" "), 400, parsed.errors);
  }

  if (parsed.slug !== existing.slug) {
    const duplicate = await ProductModel.findOne({ slug: parsed.slug, _id: { $ne: existing._id } }).lean();
    if (duplicate) {
      throw new CatalogRequestError("A product with this slug already exists.", 409);
    }
  }

  /**
   * A variant is removed by submitting a `variants` array that no longer
   * contains it. Orders snapshot `variantId`, so a variant that appears in any
   * order is historical data and must not be removed — the admin is told to
   * deactivate it instead. This is checked here, in the service, so no caller
   * can bypass it.
   */
  const nextVariantIds = new Set(
    (parsed.variants as Array<{ variantId?: string }>).map(
      (variant: { variantId?: string }) => variant.variantId,
    ),
  );
  const existingVariants = (existing.variants ?? []) as Array<{ variantId?: string }>;
  const removedVariantIds = existingVariants
    .map((variant: { variantId?: string }) => variant.variantId)
    .filter((variantId: string | undefined): variantId is string =>
      Boolean(variantId) && !nextVariantIds.has(variantId),
    );

  if (removedVariantIds.length > 0) {
    const OrderModel = (await import("@/models/Order")).default;
    const referenced = (await OrderModel.distinct("items.variantId", {
      "items.variantId": { $in: removedVariantIds },
    })) as string[];
    const blocked = removedVariantIds.filter((variantId) => referenced.includes(variantId));
    if (blocked.length > 0) {
      throw new CatalogRequestError(
        blocked.length === 1
          ? "This size is referenced by existing orders and cannot be deleted. Deactivate it instead."
          : "Some sizes are referenced by existing orders and cannot be deleted. Deactivate them instead.",
        409,
        blocked,
      );
    }
  }

  const product = await ProductModel.findOneAndUpdate(
    { _id: existing._id },
    { $set: productFields(parsed, category) },
    { returnDocument: "after", runValidators: true },
  ).lean();
  if (!product) {
    throw new CatalogRequestError("Product not found.", 404);
  }
  await deleteRemovedVariantAssets(existing.variants || [], parsed.variants);
  return product;
}

export function errorResponse(error: unknown) {
  if (error instanceof CatalogRequestError) {
    return {
      body: { error: error.message, errors: error.errors },
      status: error.status,
    };
  }
  return {
    body: { error: error instanceof Error ? error.message : "Catalog request failed." },
    status: 500,
  };
}
