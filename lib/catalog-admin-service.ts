/**
 * Admin catalog mutations: activation state and permanent deletion for
 * categories, products and variants.
 *
 * ## Deletion safety
 *
 * Orders snapshot `productId` / `variantId` as plain strings (see
 * `models/Order.ts`). Those snapshots are the historical record, so a product or
 * variant that appears in any order can never be removed — doing so would
 * orphan a real order line. A category is only removable when none of its
 * products appear in an order; when that holds, the category's products are
 * removed with it so no orphan product records are left behind.
 *
 * Every operation is resolved one record at a time and reports a per-record
 * outcome. `deleteMany` is only ever called with ids that have already passed
 * the order-reference check, never with a raw client-supplied list.
 *
 * Nothing in here reads a role, flag or ownership claim from the client: the
 * routes call `requireAdminSession()` before reaching this module.
 */

import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";
import OrderModel from "@/models/Order";
import { deleteProductVariantAssets } from "@/lib/product-service";

export type CatalogAction = "activate" | "deactivate" | "delete";

export type CatalogOutcome = "updated" | "deleted" | "blocked" | "not-found";

export interface CatalogActionItem {
  /** The identifier that was requested, echoed back for the UI. */
  id: string;
  label: string;
  outcome: CatalogOutcome;
  reason?: string;
}

export interface CatalogActionResult {
  requested: number;
  updated: number;
  deleted: number;
  blocked: number;
  notFound: number;
  items: CatalogActionItem[];
}

export class CatalogAdminError extends Error {
  constructor(
    message: string,
    readonly errors: string[] = [],
  ) {
    super(message);
    this.name = "CatalogAdminError";
  }
}

function productFilter(id: string) {
  return { $or: [{ productId: id }, { slug: id }] };
}

function categoryFilter(id: string) {
  return { $or: [{ categoryId: id }, { slug: id }] };
}

function summarise(requested: number, items: CatalogActionItem[]): CatalogActionResult {
  return {
    requested,
    updated: items.filter((item) => item.outcome === "updated").length,
    deleted: items.filter((item) => item.outcome === "deleted").length,
    blocked: items.filter((item) => item.outcome === "blocked").length,
    notFound: items.filter((item) => item.outcome === "not-found").length,
    items,
  };
}

/** Validates the `{ ids, action }` payload. Never trusts a client query. */
export function parseBulkRequest(value: unknown): { ids: string[]; action: CatalogAction } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CatalogAdminError("Invalid request body.");
  }
  const body = value as Record<string, unknown>;

  const rawIds = body.ids;
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    throw new CatalogAdminError("Select at least one record.");
  }
  if (rawIds.length > 500) {
    throw new CatalogAdminError("Too many records selected.");
  }

  const errors: string[] = [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const entry of rawIds) {
    if (typeof entry !== "string" || !entry.trim()) {
      errors.push("Every selected id must be a non-empty string.");
      continue;
    }
    const id = entry.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  const action = body.action;
  if (action !== "activate" && action !== "deactivate" && action !== "delete") {
    errors.push('Action must be "activate", "deactivate" or "delete".');
  }

  if (errors.length > 0) throw new CatalogAdminError("Invalid request body.", errors);
  return { ids, action: action as CatalogAction };
}

async function referencedProductIds(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  const refs = await OrderModel.distinct("items.productId", {
    "items.productId": { $in: productIds },
  });
  return new Set((refs as string[]).filter(Boolean));
}

async function referencedVariantIds(variantIds: string[]): Promise<Set<string>> {
  if (variantIds.length === 0) return new Set();
  const refs = await OrderModel.distinct("items.variantId", {
    "items.variantId": { $in: variantIds },
  });
  return new Set((refs as string[]).filter(Boolean));
}

// --- Products -------------------------------------------------------------

export async function setProductsActive(ids: string[], isActive: boolean): Promise<CatalogActionResult> {
  await connectToDatabase();
  const items: CatalogActionItem[] = [];

  for (const id of ids) {
    const product = await ProductModel.findOne(productFilter(id));
    if (!product) {
      items.push({ id, label: id, outcome: "not-found", reason: "Product not found." });
      continue;
    }
    if (product.isActive === isActive) {
      items.push({ id, label: product.name, outcome: "updated" });
      continue;
    }
    product.isActive = isActive;
    await product.save();
    items.push({ id, label: product.name, outcome: "updated" });
  }

  return summarise(ids.length, items);
}

/**
 * Permanently deletes products, one validated record at a time. A product that
 * appears in any order is preserved and reported as blocked.
 */
export async function deleteProducts(ids: string[]): Promise<CatalogActionResult> {
  await connectToDatabase();
  const items: CatalogActionItem[] = [];

  const found: Array<{ productId: string; name: string; variants: Array<{ imagePublicId?: string | null }> }> = [];
  for (const id of ids) {
    const product = await ProductModel.findOne(productFilter(id));
    if (!product) {
      items.push({ id, label: id, outcome: "not-found", reason: "Product not found." });
      continue;
    }
    found.push({
      productId: product.productId,
      name: product.name,
      variants: product.variants.map((variant: { imagePublicId?: string | null }) => ({
        imagePublicId: variant.imagePublicId,
      })),
    });
  }

  const referenced = await referencedProductIds(found.map((product) => product.productId));
  const deletable: string[] = [];

  for (const product of found) {
    if (referenced.has(product.productId)) {
      items.push({
        id: product.productId,
        label: product.name,
        outcome: "blocked",
        reason: "This product is referenced by existing orders. Deactivate it instead.",
      });
      continue;
    }
    deletable.push(product.productId);
    items.push({ id: product.productId, label: product.name, outcome: "deleted" });
  }

  // Only ever called with ids that passed the order-reference check above.
  if (deletable.length > 0) {
    await ProductModel.deleteMany({ productId: { $in: deletable } });
    for (const product of found) {
      if (!deletable.includes(product.productId)) continue;
      await deleteProductVariantAssets(product.variants);
    }
  }

  return summarise(ids.length, items);
}

// --- Variants -------------------------------------------------------------

/**
 * Guards permanent removal of a single variant. Returns `null` when the variant
 * may be removed, or a human-readable reason when an order references it.
 */
export async function variantDeletionBlock(variantId: string): Promise<string | null> {
  await connectToDatabase();
  const referenced = await referencedVariantIds([variantId]);
  if (referenced.has(variantId)) {
    return "This size is referenced by existing orders. Deactivate it instead.";
  }
  return null;
}

// --- Categories -----------------------------------------------------------

export async function setCategoriesActive(ids: string[], isActive: boolean): Promise<CatalogActionResult> {
  await connectToDatabase();
  const items: CatalogActionItem[] = [];

  for (const id of ids) {
    const category = await CategoryModel.findOne(categoryFilter(id));
    if (!category) {
      items.push({ id, label: id, outcome: "not-found", reason: "Category not found." });
      continue;
    }
    if (category.isActive !== isActive) {
      category.isActive = isActive;
      await category.save();
    }
    items.push({ id, label: category.name, outcome: "updated" });
  }

  return summarise(ids.length, items);
}

/**
 * Permanently deletes categories, one validated record at a time.
 *
 * A category is blocked outright when any of its products appears in an order.
 * Otherwise the category and its unreferenced products are removed together so
 * no orphan product records survive, and their managed images are cleaned up.
 */
export async function deleteCategories(ids: string[]): Promise<CatalogActionResult> {
  await connectToDatabase();
  const items: CatalogActionItem[] = [];

  const found: Array<{ categoryId: string; name: string }> = [];
  for (const id of ids) {
    const category = await CategoryModel.findOne(categoryFilter(id));
    if (!category) {
      items.push({ id, label: id, outcome: "not-found", reason: "Category not found." });
      continue;
    }
    found.push({ categoryId: category.categoryId, name: category.name });
  }

  for (const category of found) {
    const products = await ProductModel.find({
      $or: [{ categoryId: category.categoryId }, { categorySlug: category.categoryId }, { category: category.categoryId }],
    });

    const referenced = await referencedProductIds(products.map((product) => product.productId));

    if (referenced.size > 0) {
      items.push({
        id: category.categoryId,
        label: category.name,
        outcome: "blocked",
        reason:
          "This category contains products referenced by historical orders, so it cannot be permanently deleted. Deactivate it instead.",
      });
      continue;
    }

    if (products.length > 0) {
      const productIds = products.map((product) => product.productId);
      await ProductModel.deleteMany({ productId: { $in: productIds } });
      for (const product of products) {
        await deleteProductVariantAssets(
          product.variants.map((variant: { imagePublicId?: string | null }) => ({
            imagePublicId: variant.imagePublicId,
          })),
        );
      }
    }

    await CategoryModel.deleteOne({ categoryId: category.categoryId });
    items.push({ id: category.categoryId, label: category.name, outcome: "deleted" });
  }

  return summarise(ids.length, items);
}

export function catalogAdminErrorResponse(error: unknown): {
  body: { error: string; errors: string[] };
  status: number;
} {
  if (error instanceof CatalogAdminError) {
    return { body: { error: error.message, errors: error.errors }, status: 400 };
  }
  const message = error instanceof Error ? error.message : "Catalog action failed.";
  return { body: { error: message, errors: [] }, status: 500 };
}
