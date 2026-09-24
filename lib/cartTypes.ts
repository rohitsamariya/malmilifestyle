// Cart item type — a product + a specific variant selection
export interface CartItem {
  /** product.id */
  productId: string;
  /** variant.id */
  variantId: string;
  /** product.slug — for linking back to the PDP */
  productSlug: string;
  /** product.name */
  productName: string;
  /** variant.size — display label */
  variantSize: string;
  /** product.images[0] */
  productImage: string;
  /** variant selling price (INR) */
  price: number;
  /** variant MRP (INR), null if none */
  mrp: number | null;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

/** Stable key used in localStorage */
export const CART_STORAGE_KEY = "malmi-cart";