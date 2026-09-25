import { nanoid } from "nanoid";

export interface ParsedVariant {
  variantId: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  image: string | null;
  imagePublicId: string | null;
}

export interface ParsedProduct {
  name: string;
  slug: string;
  description: string;
  variants: ParsedVariant[];
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  isActive: boolean;
  errors: string[];
}

export interface ParsedCategory {
  name: string;
  slug: string;
  shortName: string;
  description: string;
  image: string;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown): string | null {
  const result = stringValue(value);
  return result || null;
}

function numberValue(value: unknown, fallback: number): number {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseVariants(value: unknown, errors: string[]): ParsedVariant[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("At least one variant is required.");
    return [];
  }

  const ids = new Set<string>();
  const sizes = new Set<string>();
  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`Variant ${index + 1} is invalid.`);
      return [];
    }

    const size = stringValue(entry.size);
    const price = numberValue(entry.price, Number.NaN);
    const compareAtPrice = entry.compareAtPrice == null || entry.compareAtPrice === ""
      ? null
      : numberValue(entry.compareAtPrice, Number.NaN);
    const stock = numberValue(entry.stock, Number.NaN);
    const variantId = stringValue(entry.variantId) || `variant-${nanoid(8)}`;
    const normalizedSize = size.toLowerCase();

    if (!size) errors.push(`Variant ${index + 1} must have a size.`);
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Variant "${size || index + 1}": price must be zero or greater.`);
    }
    if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
      errors.push(`Variant "${size || index + 1}": MRP must be zero or greater.`);
    }
    if (compareAtPrice !== null && Number.isFinite(price) && compareAtPrice < price) {
      errors.push(`Variant "${size || index + 1}": MRP must be at least the selling price.`);
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.push(`Variant "${size || index + 1}": stock must be a whole number of zero or greater.`);
    }
    if (ids.has(variantId)) errors.push(`Duplicate variant ID: "${variantId}".`);
    if (sizes.has(normalizedSize)) errors.push(`Duplicate variant size: "${size}".`);
    ids.add(variantId);
    sizes.add(normalizedSize);

    return [{
      variantId,
      size,
      price,
      compareAtPrice,
      stock,
      isActive: entry.isActive !== false,
      image: optionalString(entry.image),
      imagePublicId: optionalString(entry.imagePublicId),
    }];
  });
}

export function parseProductInput(value: unknown): ParsedProduct {
  const errors: string[] = [];
  const body = isRecord(value) ? value : {};
  const name = stringValue(body.name);
  const slug = slugify(stringValue(body.slug || name));
  const description = stringValue(body.description);

  if (!name) errors.push("Product name is required.");
  if (!slug) errors.push("Product slug is required.");
  if (!description) errors.push("Product description is required.");

  const variants = parseVariants(body.variants, errors);
  const activeVariants = variants.filter((variant) => variant.isActive);
  const priceableVariants = activeVariants.length ? activeVariants : variants;
  const price = priceableVariants.length
    ? Math.min(...priceableVariants.map((variant) => variant.price))
    : 0;
  const cheapest = priceableVariants.find((variant) => variant.price === price);
  const compareAtPrice = cheapest?.compareAtPrice ?? null;

  return {
    name,
    slug,
    description,
    variants,
    price,
    compareAtPrice,
    badge: optionalString(body.badge),
    isActive: body.isActive !== false,
    errors,
  };
}

export function parseCategoryInput(value: unknown): ParsedCategory {
  const errors: string[] = [];
  const body = isRecord(value) ? value : {};
  const name = stringValue(body.name);
  const slug = slugify(stringValue(body.slug || name));
  const shortName = stringValue(body.shortName) || name;
  const sortOrder = numberValue(body.sortOrder, 0);

  if (!name) errors.push("Category name is required.");
  if (!slug) errors.push("Category slug is required.");
  if (!shortName) errors.push("Category short name is required.");
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.push("Sort order must be a whole number of zero or greater.");
  }

  return {
    name,
    slug,
    shortName,
    description: stringValue(body.description),
    image: stringValue(body.image),
    imagePublicId: optionalString(body.imagePublicId),
    isActive: body.isActive !== false,
    sortOrder,
    errors,
  };
}

export function productBodyWithCategory(
  value: Record<string, unknown>,
  category: { categoryId: string; slug: string },
): Record<string, unknown> {
  return {
    ...value,
    categoryId: category.categoryId,
    categorySlug: category.slug,
    category: category.slug,
  };
}
