"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface ConfirmationOrder {
  orderId: string;
  orderStatus: string;
  items: Array<{
    productName: string;
    variantSize: string;
    quantity: number;
    unitPrice: number;
    itemTotal: number;
    productImage: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  payment: { method: string; status: string };
  paidAt?: string | null;
}

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const result = await response.json() as { order?: ConfirmationOrder; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error || "Order not found.");
        if (active) setOrder(result.order);
      })
      .catch((fetchError: unknown) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Unable to load the order.");
      });
    return () => { active = false; };
  }, [orderId]);

  if (!order && !error) {
    return <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-24 text-sm text-earth">Loading your order...</main>;
  }
  if (!order) {
    return <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center"><h1 className="font-display text-2xl font-bold text-forest">Order unavailable</h1><p role="alert" className="mt-2 text-sm text-earth">{error}</p><Link href="/products" className="mt-6 text-sm font-bold text-forest underline">Continue shopping</Link></main>;
  }

  const address = order.shippingAddress;
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
      <div className="border-b border-beige pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest">Order confirmed</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-forest">Thank you, {address.fullName}</h1>
        <p className="mt-2 text-sm text-earth">Your Cash on Delivery order has been placed.</p>
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-earth-light">Order number</p><p className="mt-1 break-all font-bold text-forest">{order.orderId}</p></div>
          <div><p className="text-xs text-earth-light">Order status</p><p className="mt-1 font-bold text-forest">{order.orderStatus}</p></div>
          <div><p className="text-xs text-earth-light">Payment</p><p className="mt-1 font-bold text-forest">{order.payment.method} · {order.payment.status}</p>{order.paidAt && <p className="mt-0.5 text-xs text-earth">Paid on {new Date(order.paidAt).toLocaleString()}</p>}</div>
        </div>
      </div>

      <div className="grid gap-10 py-8 md:grid-cols-[1fr_280px]">
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="text-lg font-bold text-forest">Items ordered</h2>
          <ul className="mt-3 divide-y divide-beige">
            {order.items.map((item, index) => (
              <li key={`${item.productName}-${item.variantSize}-${index}`} className="flex items-center gap-4 py-4">
                <Image src={item.productImage || "/images/hero-visual.svg"} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-md bg-cream-deep object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-forest">{item.productName}</p>
                  <p className="mt-1 text-xs text-earth">{item.variantSize} · Qty {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-forest">{formatPrice(item.itemTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-beige pt-4">
            <h2 className="text-lg font-bold text-forest">Delivery address</h2>
            <address className="mt-2 text-sm not-italic leading-relaxed text-earth">
              {address.fullName}<br />{address.phone}{address.email ? <><br />{address.email}</> : null}<br />
              {address.addressLine1}{address.addressLine2 ? <><br />{address.addressLine2}</> : null}<br />
              {address.city}, {address.state} {address.pincode}
            </address>
          </div>
        </section>

        <aside aria-label="Order total" className="border-t border-beige pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <h2 className="text-lg font-bold text-forest">Pricing</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-earth">Subtotal</dt><dd className="font-semibold text-forest">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-earth">Shipping</dt><dd className="font-semibold text-forest">{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd></div>
            {order.discountAmount > 0 && <div className="flex justify-between"><dt className="text-earth">Discount</dt><dd className="font-semibold text-forest">−{formatPrice(order.discountAmount)}</dd></div>}
            <div className="flex justify-between border-t border-beige pt-3 text-base"><dt className="font-bold text-forest">COD total</dt><dd className="font-black text-forest">{formatPrice(order.totalAmount)}</dd></div>
          </dl>
        </aside>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/products" className="inline-flex h-11 items-center rounded-lg bg-forest px-6 text-sm font-bold text-cream">Continue shopping</Link>
        <Link href="/profile" className="text-sm font-bold text-forest underline underline-offset-4">View all your orders</Link>
      </div>
    </main>
  );
}
