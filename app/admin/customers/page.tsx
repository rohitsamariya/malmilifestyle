export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">
          Customer Directory
        </h2>
        <p className="mt-1 text-xs text-earth sm:text-sm">
          View registered customer accounts, order histories and contact details.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-beige bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-earth">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>

        <h3 className="mt-4 font-display text-lg font-bold text-forest">
          No customers yet
        </h3>

        <p className="mt-1.5 max-w-sm mx-auto text-xs leading-relaxed text-earth">
          Customer profiles, saved shipping addresses and order history metrics will appear here.
        </p>
      </div>
    </div>
  );
}
