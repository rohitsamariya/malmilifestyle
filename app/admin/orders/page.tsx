export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">
          Orders Management
        </h2>
        <p className="mt-1 text-xs text-earth sm:text-sm">
          Track customer order fulfillments, shipping statuses and invoices.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-beige bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-earth">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>

        <h3 className="mt-4 font-display text-lg font-bold text-forest">
          No orders yet
        </h3>

        <p className="mt-1.5 max-w-sm mx-auto text-xs leading-relaxed text-earth">
          Customer checkout transactions and order processing records will be listed here as orders are placed.
        </p>
      </div>
    </div>
  );
}
