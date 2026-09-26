"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface AdminOrder {
  orderId: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items?: Array<{
    productName: string;
    variantSize: string;
    quantity: number;
    unitPrice: number;
    unitMrp: number | null;
    itemTotal: number;
  }>;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount: number;
  payment?: { method: string; status: string };
  paymentStatus?: string;
  paidAt?: string | null;
  orderStatus: string;
  shipment?: { provider: string; status: string };
  createdAt: string;
}

const nextStatus: Record<string, string> = {
  PLACED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = await response.json() as { orders?: AdminOrder[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to load orders.");
      setOrders(result.orders || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/orders", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { orders?: AdminOrder[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to load orders.");
        if (active) setOrders(result.orders || []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function openOrder(orderId: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const result = await response.json() as { order?: AdminOrder; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || "Unable to load order details.");
      setSelected(result.order);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Unable to load order details.");
    }
  }

  async function changeStatus(status: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(selected.orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
      const result = await response.json() as { order?: AdminOrder; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || "Unable to update order.");
      setSelected(result.order);
      await loadOrders();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">Orders Management</h2>
        <p className="mt-1 text-xs text-earth sm:text-sm">Review COD orders and manage fulfillment.</p>
      </div>

      {error && <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <section aria-label="Order list" className="overflow-hidden border-y border-beige bg-white">
        <div className="flex items-center justify-between border-b border-beige px-4 py-3">
          <h3 className="text-sm font-bold text-forest">Recent orders</h3>
          <button type="button" onClick={() => void loadOrders()} className="text-xs font-semibold text-forest underline underline-offset-2">Refresh</button>
        </div>
        {loading ? <p className="px-4 py-10 text-center text-sm text-earth">Loading orders...</p> : orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-earth">No orders have been placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-xs">
              <thead className="border-b border-beige bg-cream/70 text-[10px] uppercase tracking-wide text-earth">
                <tr>
                  <th className="px-4 py-3 font-bold">Order ID</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Order status</th>
                  <th className="px-4 py-3 font-bold">Shipment</th>
                  <th className="px-4 py-3 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige">
                {orders.map((order) => (
                  <tr key={order.orderId} className={selected?.orderId === order.orderId ? "bg-cream/60" : "hover:bg-cream/30"}>
                    <td className="px-4 py-3"><button type="button" onClick={() => void openOrder(order.orderId)} className="font-semibold text-forest underline-offset-2 hover:underline">{order.orderId}</button></td>
                    <td className="px-4 py-3 text-forest">{order.shippingAddress?.fullName || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-forest">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-earth">{order.payment?.method || "COD"} · {order.payment?.status || order.paymentStatus || "PENDING"}</td>
                    <td className="px-4 py-3 text-earth">{order.orderStatus}</td>
                    <td className="px-4 py-3 text-earth">{order.shipment?.status || "NOT_CREATED"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-earth">{displayDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section aria-labelledby="order-detail-heading" className="border-y border-beige bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-beige px-4 py-4">
            <div>
              <h3 id="order-detail-heading" className="text-base font-bold text-forest">Order {selected.orderId}</h3>
              <p className="mt-1 text-xs text-earth">Created {displayDate(selected.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {nextStatus[selected.orderStatus] && <button type="button" disabled={busy} onClick={() => void changeStatus(nextStatus[selected.orderStatus])} className="h-9 rounded-md bg-forest px-3 text-xs font-bold text-cream disabled:opacity-50">Mark {nextStatus[selected.orderStatus]}</button>}
              {(selected.orderStatus === "PLACED" || selected.orderStatus === "PACKED") && <button type="button" disabled={busy} onClick={() => void changeStatus("CANCELLED")} className="h-9 rounded-md border border-red-300 px-3 text-xs font-bold text-red-700 disabled:opacity-50">Cancel order</button>}
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-7 px-4 py-5 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-earth">Customer</h4>
              <p className="mt-2 text-sm font-semibold text-forest">{selected.shippingAddress.fullName}</p>
              <p className="mt-1 text-sm text-earth">{selected.shippingAddress.phone}{selected.shippingAddress.email ? ` · ${selected.shippingAddress.email}` : ""}</p>
              <h4 className="mt-5 text-xs font-bold uppercase tracking-wide text-earth">Shipping address</h4>
              <address className="mt-2 text-sm not-italic leading-relaxed text-forest">
                {selected.shippingAddress.addressLine1}{selected.shippingAddress.addressLine2 ? `, ${selected.shippingAddress.addressLine2}` : ""}<br />
                {selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.pincode}
              </address>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-earth">Payment & shipment</h4>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-earth">Payment</dt><dd className="font-semibold text-forest">{selected.payment?.method || "COD"} · {selected.payment?.status || selected.paymentStatus || "PENDING"}</dd></div>
                {selected.paidAt && <div className="flex justify-between gap-4"><dt className="text-earth">Paid on</dt><dd className="font-semibold text-forest">{displayDate(selected.paidAt)}</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-earth">Shipment</dt><dd className="font-semibold text-forest">{selected.shipment?.status || "NOT_CREATED"} ({selected.shipment?.provider || "MANUAL"})</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-earth">Order status</dt><dd className="font-semibold text-forest">{selected.orderStatus}</dd></div>
              </dl>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-earth">Items</h4>
              <div className="mt-2 divide-y divide-beige border-y border-beige">
                {(selected.items || []).map((item, index) => (
                  <div key={`${item.productName}-${item.variantSize}-${index}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <span className="text-forest">{item.productName} · {item.variantSize} × {item.quantity}</span>
                    <span className="font-semibold text-forest">{formatPrice(item.unitPrice)} each · {formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>
              <dl className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-earth">Subtotal</dt><dd className="text-forest">{formatPrice(selected.subtotal ?? selected.totalAmount)}</dd></div>
                <div className="flex justify-between"><dt className="text-earth">Shipping</dt><dd className="text-forest">{formatPrice(selected.shippingFee ?? 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-earth">Discount</dt><dd className="text-forest">{formatPrice(selected.discountAmount ?? 0)}</dd></div>
                <div className="flex justify-between border-t border-beige pt-2 text-base"><dt className="font-bold text-forest">Total</dt><dd className="font-black text-forest">{formatPrice(selected.totalAmount)}</dd></div>
              </dl>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
