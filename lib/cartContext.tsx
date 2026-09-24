"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem, CartState } from "@/lib/cartTypes";
import { CART_STORAGE_KEY } from "@/lib/cartTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartContextValue {
  items: CartItem[];
  /** Total quantity across all items */
  cartCount: number;
  /** Sum of (price * quantity) for all items */
  subtotal: number;
  /** Sum of (mrp * quantity) for all items that have MRP */
  mrpTotal: number;
  /** mrpTotal - subtotal */
  totalSaving: number;

  addToCart: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, variantId: string, qty: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;

  /** Toast message — null when nothing to show */
  toast: string | null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed?.items)) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // storage quota or private mode — silently ignore
  }
}

function cartKey(productId: string, variantId: string) {
  return `${productId}__${variantId}`;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage once on mount (client-only)
  useEffect(() => {
    if (!hydrated.current) {
      setItems(loadFromStorage());
      hydrated.current = true;
    }
  }, []);

  // Persist whenever items change (after hydration)
  useEffect(() => {
    if (hydrated.current) {
      saveToStorage(items);
    }
  }, [items]);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const addToCart = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const key = cartKey(newItem.productId, newItem.variantId);
      const exists = prev.find(
        (i) => cartKey(i.productId, i.variantId) === key,
      );
      if (exists) {
        return prev.map((i) =>
          cartKey(i.productId, i.variantId) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    showToast(`Added to cart`);
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string, qty: number) => {
      if (qty < 1) return;
      setItems((prev) =>
        prev.map((i) =>
          cartKey(i.productId, i.variantId) === cartKey(productId, variantId)
            ? { ...i, quantity: qty }
            : i,
        ),
      );
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string, variantId: string) => {
      setItems((prev) =>
        prev.filter(
          (i) =>
            cartKey(i.productId, i.variantId) !==
            cartKey(productId, variantId),
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );

  const mrpTotal = useMemo(
    () => items.reduce((s, i) => s + (i.mrp ?? i.price) * i.quantity, 0),
    [items],
  );

  const totalSaving = mrpTotal - subtotal;

  const value: CartContextValue = {
    items,
    cartCount,
    subtotal,
    mrpTotal,
    totalSaving,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}