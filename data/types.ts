export type ProductCategory = string;
export type CategorySlug = "all" | ProductCategory;

export interface Category {
  categoryId?: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  image?: string | null;
  imagePublicId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  price: number | null;
  compareAtPrice: number | null;
  image: string | null;
  imagePublicId: string | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  productId?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  categoryId?: string;
  categorySlug?: ProductCategory;
  description: string;
  variants: ProductVariant[];
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  compareAtPrice: number | null;
  badge: string | null;
  isActive?: boolean;
}

export interface ProductListing {
  listingKey: string;
  product: Product;
  variant: ProductVariant;
}
