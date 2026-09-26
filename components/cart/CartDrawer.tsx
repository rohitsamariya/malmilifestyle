"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import { XIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function QuantityBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-beige text-base font-bold text-forest transition-colors hover:bg-beige disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Right-side cart drawer.
 * - Slides in from the right with CSS transition.
 * - Clicking the overlay or pressing Escape closes it.
 * - Consumes the same CartContext as ProductCard and Navbar.
 */
export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, cartCount, subtotal, totalSaving, updateQuantity, removeFromCart, clearCart } =
    useCart();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClear() {
    if (window.confirm("Clear your entire cart?")) clearCart();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/35 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-white shadow-[-8px_0_40px_-8px_rgba(21,41,30,0.3)] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-beige px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-forest">Your Cart</h2>
            <p className="text-xs text-earth-light">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-forest transition-colors hover:bg-cream"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-deep">
              <svg aria-hidden className="h-10 w-10 text-earth-lighter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7h12l1.2 12.2a1.8 1.8 0 0 1-1.79 1.99H6.59a1.8 1.8 0 0 1-1.79-1.99L6 7z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-forest">Your cart is empty</p>
              <p className="mt-1 text-sm text-earth-light">
                Add products to get started.
              </p>
            </div>
            <Link
              href="/products"
              onClick={onClose}
              className="mt-2 inline-flex h-11 items-center rounded-xl bg-forest px-6 text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30]"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            {/* Scrollable items list */}
            <ul className="flex-1 divide-y divide-beige overflow-y-auto px-4 py-2">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <li
                    key={`${item.productId}__${item.variantId}`}
                    className="flex gap-3 py-4"
                  >
                    {/* Image */}
                    <Link href={`/products/${item.productSlug}`} onClick={onClose} className="shrink-0">
                      <div className="h-20 w-20 overflow-hidden rounded-xl bg-cream-deep">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                            onClick={onClose}
                            className="block truncate text-[13px] font-semibold text-forest hover:underline"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-[11px] text-earth">{item.variantSize}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="shrink-0 text-[10px] font-medium text-earth-lighter hover:text-forest"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Price per unit */}
                      <div className="flex items-baseline gap-1.5">
                        {item.mrp !== null && item.mrp > item.price && (
                          <span className="text-[10px] text-earth-lighter line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-forest">
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      {/* Quantity + line total */}
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QuantityBtn
                            label="Decrease quantity"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity - 1)
                            }
                          >
                            -
                          </QuantityBtn>
                          <span className="w-6 text-center text-sm font-semibold text-forest">
                            {item.quantity}
                          </span>
                          <QuantityBtn
                            label="Increase quantity"
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity + 1)
                            }
                          >
                            +
                          </QuantityBtn>
                        </div>
                        <span className="text-sm font-black text-forest">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="border-t border-beige px-5 py-4">
              {/* Savings */}
              {totalSaving > 0 && (
                <p className="mb-2 text-center text-[11px] font-semibold text-[#2d7a4f]">
                  You save {formatPrice(totalSaving)} on this order
                </p>
              )}

              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-earth">Subtotal</span>
                <span className="text-xl font-black text-forest">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-0.5 text-xs text-earth-light">
                Taxes and shipping calculated at checkout.
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-forest text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30]"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-forest text-sm font-semibold text-forest transition-colors hover:bg-cream"
                >
                  View Full Cart
                </Link>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="mt-3 w-full text-center text-xs text-earth-light underline-offset-2 hover:text-forest hover:underline"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}