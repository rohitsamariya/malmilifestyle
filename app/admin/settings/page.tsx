export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">
          Admin & Store Settings
        </h2>
        <p className="mt-1 text-xs text-earth sm:text-sm">
          Manage general store preferences, administrator security and region settings.
        </p>
      </div>

      {/* Store Information */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-bold text-forest border-b border-beige pb-3">
          Store Information
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Store Name</label>
            <input
              type="text"
              readOnly
              value="Malmi Lifestyle"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Currency</label>
            <input
              type="text"
              readOnly
              value="Indian Rupee (INR ₹)"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Support Email</label>
            <input
              type="text"
              readOnly
              value="care@malmilifestyle.com"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Region / Location</label>
            <input
              type="text"
              readOnly
              value="India"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
        </div>
      </div>

      {/* Admin Account Security */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-bold text-forest border-b border-beige pb-3">
          Admin Account & Security
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Admin Email</label>
            <input
              type="text"
              readOnly
              value="admin@malmilifestyle.com"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth">Session Lifetime</label>
            <input
              type="text"
              readOnly
              value="24 Hours (HTTP-Only Cookie)"
              className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest"
            />
          </div>
        </div>
      </div>

      {/* Store Preferences */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-bold text-forest border-b border-beige pb-3">
          Store Preferences
        </h3>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-xs text-forest cursor-pointer">
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-sand text-forest" />
            Enable variant listing mode across category pages
          </label>
          <label className="flex items-center gap-3 text-xs text-forest cursor-pointer">
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-sand text-forest" />
            Display strikethrough compare-at pricing on product cards
          </label>
        </div>
      </div>
    </div>
  );
}
