import type { Metadata } from "next";
import Link from "next/link";
import AddressBook from "@/components/profile/AddressBook";
import AccountDetails from "@/components/profile/AccountDetails";
import PhoneStatusBadge from "@/components/profile/PhoneStatusBadge";
import { requireCustomerPage } from "@/lib/customerAuth";
import { listCustomerAddresses } from "@/lib/address-service";
import { listOrdersForCustomer } from "@/lib/order-service";
import { formatPrice } from "@/lib/utils";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Your Account",
  description:
    "Manage your orders, saved addresses and account details on Malmi Lifestyle.",
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : "";
  return (first + last).toUpperCase() || "M";
}

function statusPillClass(status: string): string {
  if (status === "DELIVERED") return "bg-forest/10 text-forest";
  if (status === "CANCELLED") return "bg-red-50 text-red-700";
  if (status === "SHIPPED" || status === "PACKED") return "bg-gold/20 text-earth";
  return "bg-cream text-earth";
}

export default async function ProfilePage() {
  // Redirects to /login?redirect=%2Fprofile when there is no valid session.
  const customer = await requireCustomerPage("/profile");
  const [orders, addresses] = await Promise.all([
    listOrdersForCustomer(customer.id),
    listCustomerAddresses(customer.id),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-cream/50">
      <section className="relative overflow-hidden bg-forest py-10 text-cream sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#e6d5bc_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream/15 font-display text-2xl font-semibold text-cream ring-4 ring-cream/20 sm:h-20 sm:w-20 sm:text-3xl">
              {initials(customer.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">
                Profile overview
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl lg:text-4xl">
                {customer.name || "Your Account"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="max-w-full truncate rounded-full bg-cream/10 px-3 py-1 text-xs text-cream-light/90">
                  {customer.email}
                </span>
                {customer.phone && (
                  <PhoneStatusBadge verified={customer.phoneVerified} tone="onDark" />
                )}
              </div>
            </div>
            <dl className="sm:ml-auto sm:text-right">
              <dt className="text-xs uppercase tracking-wide text-cream-light/70">
                Member since
              </dt>
              <dd className="mt-1 font-display text-sm font-semibold text-cream">
                {formatDate(customer.createdAt)}
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <AccountDetails customer={customer} />
            <div className="rounded-2xl border border-beige bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-forest">Session</h2>
              <p className="mt-1 text-xs text-earth">
                Signing out clears your session on this device only.
              </p>
              <div className="mt-4">
                <LogoutButton />
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            <section aria-labelledby="addresses-heading">
              <h2
                id="addresses-heading"
                className="font-display text-xl font-semibold text-forest"
              >
                Saved addresses
              </h2>
              <div className="mt-4 rounded-2xl border border-beige bg-white p-6 shadow-[0_16px_40px_-16px_rgba(21,41,30,0.14)]">
                <AddressBook initialAddresses={addresses} />
              </div>
            </section>

            <section aria-labelledby="orders-heading">
              <h2
                id="orders-heading"
                className="font-display text-xl font-semibold text-forest"
              >
                My orders
              </h2>

              {orders.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-beige bg-white p-10 text-center">
                  <p className="text-sm text-earth">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Link
                    href="/products"
                    className="mt-5 inline-flex h-11 items-center rounded-lg bg-forest px-6 text-sm font-bold text-cream transition-opacity hover:opacity-90"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {orders.map((order) => (
                    <li
                      key={order.orderId}
                      className="overflow-hidden rounded-2xl border border-beige bg-white shadow-[0_16px_40px_-18px_rgba(21,41,30,0.16)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige/70 bg-cream/40 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-bold text-forest">
                            {order.orderId}
                          </p>
                          <p className="mt-0.5 text-xs text-earth">
                            Placed {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusPillClass(
                            order.orderStatus,
                          )}`}
                        >
                          {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                        </span>
                      </div>

                      <ul className="divide-y divide-beige/60 px-5">
                        {order.items.map((item, index) => (
                          <li
                            key={`${order.orderId}-${index}`}
                            className="flex items-center justify-between gap-3 py-3 text-sm"
                          >
                            <span className="min-w-0 truncate text-forest">
                              {item.productName}
                              {item.variantSize && (
                                <span className="text-earth"> · {item.variantSize}</span>
                              )}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-earth">
                              × {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-beige/70 px-5 py-3.5">
                        <span className="rounded-full bg-cream px-2.5 py-1 text-xs text-earth">
                          {order.payment.method} ·{" "}
                          {PAYMENT_STATUS_LABELS[order.payment.status] ??
                            order.payment.status}
                          {order.paidAt
                            ? ` · ${formatDate(order.paidAt)}`
                            : ""}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-forest">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <Link
                            href={`/orders/${encodeURIComponent(order.orderId)}`}
                            className="text-xs font-bold text-forest underline underline-offset-4 hover:text-forest-soft"
                          >
                            View details
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
