import type { Metadata } from "next";
import Link from "next/link";
import { UserIcon } from "@/components/ui/icons";
import { requireCustomerPage } from "@/lib/customerAuth";
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

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  // Redirects to /login?redirect=%2Fprofile when there is no valid session.
  const customer = await requireCustomerPage("/profile");
  const orders = await listOrdersForCustomer(customer.id);

  return (
    <div className="flex flex-1 flex-col bg-cream/50">
      <section className="relative overflow-hidden bg-forest py-10 text-cream sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#e6d5bc_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream/15 text-cream ring-4 ring-cream/20 sm:h-16 sm:w-16">
            <UserIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h1 className="mt-4 text-center font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl lg:text-4xl">
            {customer.name || "Your Account"}
          </h1>
          <p className="mt-2 text-center text-xs text-cream-light/85 sm:text-sm">
            {customer.email}
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-beige bg-white p-6 shadow-[0_16px_40px_-16px_rgba(21,41,30,0.18)]">
            <h2 className="text-lg font-bold text-forest">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-earth-light">Name</dt>
                <dd className="mt-0.5 font-semibold text-forest">
                  {customer.name || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-earth-light">Email</dt>
                <dd className="mt-0.5 break-all font-semibold text-forest">
                  {customer.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-earth-light">Mobile number</dt>
                <dd className="mt-0.5 font-semibold text-forest">
                  {customer.phone || "Not provided"}
                  {customer.phone && (
                    <span className="ml-2 text-xs font-normal text-earth-light">
                      {customer.phoneVerified ? "Verified" : "Not verified"}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-earth-light">Member since</dt>
                <dd className="mt-0.5 font-semibold text-forest">
                  {formatDate(customer.createdAt)}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <LogoutButton />
            </div>
          </aside>

          <section aria-labelledby="orders-heading" className="min-w-0">
            <h2 id="orders-heading" className="text-lg font-bold text-forest">
              Your orders
            </h2>

            {orders.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-beige bg-white p-8 text-center">
                <p className="text-sm text-earth">You have not placed any orders yet.</p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex h-11 items-center rounded-lg bg-forest px-6 text-sm font-bold text-cream"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {orders.map((order) => (
                  <li
                    key={order.orderId}
                    className="rounded-2xl border border-beige bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-bold text-forest">
                          {order.orderId}
                        </p>
                        <p className="mt-1 text-xs text-earth">
                          Placed {formatDate(order.createdAt)} ·{" "}
                          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-forest">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="mt-1 text-xs text-earth">
                          {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-earth">
                      <span className="rounded-full bg-cream px-2.5 py-1">
                        {order.payment.method} · {order.payment.status}
                        {order.paidAt ? ` · paid ${new Date(order.paidAt).toLocaleDateString()}` : ""}
                      </span>
                      <span className="rounded-full bg-cream px-2.5 py-1">
                        {order.shipment.provider} · {order.shipment.status}
                      </span>
                      <Link
                        href={`/orders/${encodeURIComponent(order.orderId)}`}
                        className="ml-auto font-bold text-forest underline underline-offset-4"
                      >
                        View details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
