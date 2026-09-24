export type ProductCategory =
  | "wood-pressed-oils"
  | "wheat-atta"
  | "multigrain-atta"
  | "millet-atta";

export type CategorySlug = "all" | ProductCategory;

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
}

export interface ProductVariant {
  id: string;
  /** Display size, e.g. "500 ML", "1 L", "1 kg" */
  size: string;
  /** Selling price in INR. */
  price: number | null;
  /** MRP / strikethrough price in INR. */
  compareAtPrice: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  images: string[];
  variants: ProductVariant[];
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  compareAtPrice: number | null;
  badge: string | null;
  madeWith: "Wood-Pressed" | "Stone-Ground";
}

/**
 * A flat sellable listing entry — one product + one specific variant.
 * Used by ProductCard, ProductGrid, and ProductCarousel in listing contexts.
 * On the PDP, all variants remain accessible for selection.
 */
export interface ProductListing {
  /** Stable unique key: productId__variantId */
  listingKey: string;
  product: Product;
  variant: ProductVariant;
}