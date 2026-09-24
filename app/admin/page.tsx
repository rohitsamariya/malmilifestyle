import Link from "next/link";
import { getProducts } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const products = getProducts();
  const totalProducts = products.length;
  const totalCategories = CATEGORIES.length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-earth">
          Welcome to Malmi Lifestyle Admin. Store summary and quick actions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-earth">
              Total Products
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-forest">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-forest">
            {totalProducts}
          </p>
          <p className="mt-1 text-xs text-earth-light">Active items in catalog</p>
        </div>

        {/* Total Categories */}
        <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-earth">
              Total Categories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-forest">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-forest">
            {totalCategories}
          </p>
          <p className="mt-1 text-xs text-earth-light">Store product categories</p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-earth">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-earth">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-forest">
            0
          </p>
          <p className="mt-1 text-xs text-earth-light">No orders yet</p>
        </div>

        {/* Total Customers */}
        <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-earth">
              Total Customers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-earth">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-forest">
            0
          </p>
          <p className="mt-1 text-xs text-earth-light">No data yet</p>
        </div>
      </div>

      {/* Catalog Quick Summary */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-beige">
          <div>
            <h3 className="text-base font-bold text-forest">Recent Catalog Overview</h3>
            <p className="text-xs text-earth">Live products currently available on the storefront</p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-lg border border-forest/20 px-3.5 py-1.5 text-xs font-bold text-forest hover:bg-forest hover:text-cream transition-colors"
          >
            Manage Products
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-forest">
            <thead className="bg-cream/60 text-[10px] uppercase font-bold tracking-wider text-earth">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Starting Price</th>
                <th className="px-4 py-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/50">
              {products.slice(0, 6).map((product) => {
                const minPrice = Math.min(...product.variants.map((v) => v.price ?? product.price ?? 0));
                return (
                  <tr key={product.id} className="hover:bg-cream/30">
                    <td className="px-4 py-3.5 font-semibold text-forest">{product.name}</td>
                    <td className="px-4 py-3.5 text-earth capitalize">
                      {product.category.replace(/-/g, " ")}
                    </td>
                    <td className="px-4 py-3.5">{product.variants.length} sizes</td>
                    <td className="px-4 py-3.5 font-bold text-forest">{formatPrice(minPrice)}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
