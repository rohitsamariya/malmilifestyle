"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useCart } from "@/lib/cartContext";
import { formatPrice } from "@/lib/utils";
import type { CustomerDTO } from "@/lib/customerAuth";

interface CheckoutPageProps {
  /** Server-verified session identity. Used only to prefill the form. */
  customer: CustomerDTO;
}

interface OrderResponse {
  order?: {
    orderId: string;
    items: Array<{ productId: string; variantId: string; quantity: number }>;
  };
  error?: string;
}

function getCheckoutKey(items: Array<{ productId: string; variantId: string; quantity: number }>) {
  const fingerprint = JSON.stringify(
    items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }))
      .sort((left, right) => `${left.productId}:${left.variantId}`.localeCompare(`${right.productId}:${right.variantId}`)),
  );
  const storageKey = "malmi-checkout-idempotency";
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as { fingerprint?: string; key?: string };
      if (parsed.fingerprint === fingerprint && parsed.key) return parsed.key;
    }
    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

export default function CheckoutPage({ customer }: CheckoutPageProps) {
  const router = useRouter();
  const { items, subtotal, removePurchasedItems } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || items.length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    // Email and name are prefilled from the account but stay editable: they are
    // only ever treated as delivery details, never as proof of identity.
    const shippingAddress = {
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      addressLine1: String(formData.get("addressLine1") || ""),
      addressLine2: String(formData.get("addressLine2") || ""),
      city: String(formData.get("city") || ""),
      state: String(formData.get("state") || ""),
      pincode: String(formData.get("pincode") || ""),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
          shippingAddress,
          paymentMethod: "COD",
          idempotencyKey: getCheckoutKey(items),
        }),
      });
      const result = (await response.json()) as OrderResponse;
      if (!response.ok || !result.order?.orderId) {
        throw new Error(result.error || "We couldn't place your order. Please try again.");
      }
      try {
        sessionStorage.removeItem("malmi-checkout-idempotency");
      } catch {
        // Checkout can continue when browser storage is unavailable.
      }
      // Only the purchased lines leave the cart; anything the customer added
      // while waiting (or a partially ordered cart) is preserved.
      removePurchasedItems(
        result.order.items.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
      );
      router.push(`/orders/${encodeURIComponent(result.order.orderId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn't place your order.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-forest">Your cart is empty</h1>
        <p className="mt-3 text-sm text-earth">Add a product before checking out.</p>
        <Link href="/products" className="mt-7 inline-flex h-11 items-center rounded-lg bg-forest px-6 text-sm font-bold text-cream">
          Browse products
        </Link>
      </main>
    );
  }

  const fieldClass = "mt-1.5 h-11 w-full rounded-lg border border-sand bg-white px-3.5 text-sm text-forest outline-none focus:border-forest";
  const labelClass = "block text-xs font-semibold text-earth";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cart" className="text-sm font-semibold text-earth hover:text-forest">&larr; Back to cart</Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-forest">Delivery details</h1>
      <p className="mt-2 text-sm text-earth">
        Your order will be paid for in cash when it arrives. Signed in as{" "}
        <span className="font-semibold text-forest">{customer.email}</span> —{" "}
        <Link href="/profile" className="font-semibold text-forest underline underline-offset-4">
          your account
        </Link>
        .
      </p>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={placeOrder} className="space-y-8">
          <section aria-labelledby="customer-heading" className="border-b border-beige pb-8">
            <h2 id="customer-heading" className="text-lg font-bold text-forest">Customer details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Full name
                <input className={fieldClass} name="fullName" autoComplete="name" maxLength={200} defaultValue={customer.name} required />
              </label>
              <label className={labelClass}>
                Mobile number
                <input className={fieldClass} name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} placeholder="10-digit mobile number" defaultValue={customer.phone} required />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Email <span className="font-normal text-earth-light">(optional)</span>
                <input className={fieldClass} name="email" type="email" autoComplete="email" maxLength={254} defaultValue={customer.email} />
              </label>
            </div>
          </section>

          <section aria-labelledby="address-heading" className="border-b border-beige pb-8">
            <h2 id="address-heading" className="text-lg font-bold text-forest">Shipping address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Address line 1
                <input className={fieldClass} name="addressLine1" autoComplete="address-line1" maxLength={200} required />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Address line 2 <span className="font-normal text-earth-light">(optional)</span>
                <input className={fieldClass} name="addressLine2" autoComplete="address-line2" maxLength={200} />
              </label>
              <label className={labelClass}>
                City
                <input className={fieldClass} name="city" autoComplete="address-level2" maxLength={200} required />
              </label>
              <label className={labelClass}>
                State
                <input className={fieldClass} name="state" autoComplete="address-level1" maxLength={200} required />
              </label>
              <label className={labelClass}>
                Pincode
                <input className={fieldClass} name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[0-9]{6}" required />
              </label>
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="text-lg font-bold text-forest">Payment</h2>
            <div className="mt-4 flex items-start gap-3 border-l-4 border-forest bg-white px-4 py-3">
              <span aria-hidden className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-4 border-forest" />
              <div>
                <p className="text-sm font-bold text-forest">Cash on Delivery (COD)</p>
                <p className="mt-1 text-xs leading-relaxed text-earth">Pay the order total in cash when your delivery arrives.</p>
              </div>
            </div>
          </section>

          {error && <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center rounded-lg bg-forest px-6 text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
            {submitting ? "Placing order..." : "Place COD Order"}
          </button>
        </form>

        <aside aria-label="Order summary" className="border-t border-beige pt-5 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
          <h2 className="text-lg font-bold text-forest">Order summary</h2>
          <ul className="mt-4 divide-y divide-beige">
            {items.map((item) => (
              <li key={`${item.productId}__${item.variantId}`} className="flex justify-between gap-4 py-3 text-sm">
                <span className="min-w-0 text-earth">{item.productName} <span className="whitespace-nowrap">({item.variantSize}) x {item.quantity}</span></span>
                <span className="shrink-0 font-semibold text-forest">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-beige pt-4 text-sm">
            <span className="font-bold text-forest">Estimated subtotal</span>
            <span className="font-black text-forest">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-earth-light">Final item prices, shipping and total are calculated securely when you place your order.</p>
        </aside>
      </div>
    </main>
  );
}
