/** Joins class names, filtering out falsy values. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Formats a price in Indian Rupees, e.g. ₹449 or ₹1,999. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Discount percentage between MRP and selling price, e.g. 10. */
export function discountPercent(
  compareAtPrice: number | null | undefined,
  price: number | null | undefined,
): number | null {
  if (!compareAtPrice || !price || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Builds a catalog listing href: category slug → /products/<slug>, else /products. */
export function productsHref({ category }: { category?: string } = {}): string {
  return category && category !== "all" ? `/products/${category}` : "/products";
}