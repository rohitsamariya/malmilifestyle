"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import { formatPrice } from "@/lib/utils";

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-beige">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-forest transition-colors hover:bg-beige disabled:cursor-not-allowed disabled:opacity-40"
      >
        -
      </button>
      <span className="w-10 text-center text-sm font-semibold text-forest" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-forest transition-colors hover:bg-beige"
      >
        +
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, cartCount, subtotal, mrpTotal, totalSaving, updateQuantity, removeFromCart, clearCart } =
    useCart();

  function handleClear() {
    if (window.confirm("Clear your entire cart?")) clearCart();
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cream-deep">
            <svg
              aria-hidden
              className="h-12 w-12 text-earth-light"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 7h12l1.2 12.2a1.8 1.8 0 0 1-1.79 1.99H6.59a1.8 1.8 0 0 1-1.79-1.99L6 7z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-forest">Your Cart is Empty</h1>
          <p className="mt-3 text-sm leading-relaxed text-earth-light">
            Explore Malmi Lifestyle&apos;s wood-pressed oils and stone-ground
            flours and add something to your cart.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-forest px-8 text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30]"
          >
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  // ── Cart with items ──────────────────────────────────────────────────────
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-bold text-forest">
          Your Cart
          <span className="ml-3 text-lg font-medium text-earth-light">
            ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-medium text-earth-light underline-offset-4 hover:text-forest hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Cart Items ── */}
        <section aria-label="Cart items">
          <ul className="space-y-4">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              const lineMrp = (item.mrp ?? item.price) * item.quantity;
              const lineSaving = lineMrp - lineTotal;

              return (
                <li
                  key={`${item.productId}__${item.variantId}`}
                  className="flex gap-4 rounded-2xl border border-beige bg-white p-4 shadow-[0_4px_16px_-8px_rgba(21,41,30,0.2)]"
                >
                  {/* Product image */}
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="shrink-0"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-xl bg-cream-deep sm:h-28 sm:w-28">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={112}
                        height={112}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="text-sm font-semibold leading-snug text-forest hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-0.5 text-xs font-medium text-earth">
                          {item.variantSize}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="shrink-0 text-xs font-medium text-earth-light underline-offset-4 hover:text-forest hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Price per unit */}
                    <div className="flex items-baseline gap-2">
                      {item.mrp !== null && item.mrp > item.price && (
                        <span className="text-xs text-earth-lighter line-through">
                          {formatPrice(item.mrp)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-forest">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Quantity + line total */}
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityControl
                        quantity={item.quantity}
                        onDecrease={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        onIncrease={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                      />
                      <div className="text-right">
                        <p className="text-base font-black text-forest">
                          {formatPrice(lineTotal)}
                        </p>
                        {lineSaving > 0 && (
                          <p className="text-[10px] font-semibold text-[#2d7a4f]">
                            Save {formatPrice(lineSaving)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
            >
              <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </section>

        {/* ── Order Summary ── */}
        <aside aria-label="Order summary">
          <div className="sticky top-24 rounded-2xl border border-beige bg-white p-6 shadow-[0_8px_32px_-12px_rgba(21,41,30,0.2)]">
            <h2 className="text-lg font-bold text-forest">Order Summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-earth">
                  Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                </dt>
                <dd className="font-semibold text-forest">{formatPrice(subtotal)}</dd>
              </div>

              {totalSaving > 0 && (
                <div className="flex justify-between text-[#2d7a4f]">
                  <dt>You save</dt>
                  <dd className="font-semibold">{formatPrice(totalSaving)}</dd>
                </div>
              )}

              {totalSaving > 0 && (
                <div className="flex justify-between text-xs text-earth-lighter">
                  <dt>MRP total</dt>
                  <dd className="line-through">{formatPrice(mrpTotal)}</dd>
                </div>
              )}

              <div className="border-t border-beige pt-3">
                <div className="flex justify-between">
                  <dt className="text-base font-bold text-forest">Total</dt>
                  <dd className="text-xl font-black text-forest">{formatPrice(subtotal)}</dd>
                </div>
                <p className="mt-1 text-xs text-earth-light">Taxes and shipping calculated at checkout.</p>
              </div>
            </dl>

            <button
              type="button"
              disabled
              className="mt-6 flex h-13 w-full cursor-not-allowed items-center justify-center rounded-xl bg-forest/40 text-sm font-bold text-cream"
            >
              Proceed to Checkout
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                Coming Soon
              </span>
            </button>

            <p className="mt-3 text-center text-xs text-earth-light">
              Secure checkout coming soon.{" "}
              <a href="mailto:care@malmilifestyle.in" className="text-forest underline underline-offset-2">
                Order via email
              </a>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}