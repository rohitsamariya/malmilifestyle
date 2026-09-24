import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { getProducts } from "@/data/products";

export default function AdminCategoriesPage() {
  const products = getProducts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">
          Categories ({CATEGORIES.length})
        </h2>
        <p className="mt-1 text-xs text-earth sm:text-sm">
          Store product category taxonomy and catalog breakdown.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-forest">
            <thead className="bg-cream text-[10px] uppercase font-bold tracking-wider text-earth border-b border-beige">
              <tr>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Products Count</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60">
              {CATEGORIES.map((cat) => {
                const categoryProducts = products.filter((p) => p.category === cat.slug);
                return (
                  <tr key={cat.slug} className="hover:bg-cream/30">
                    <td className="px-5 py-4 font-bold text-forest">{cat.name}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-earth-light">{cat.slug}</td>
                    <td className="px-5 py-4 text-earth max-w-xs truncate">{cat.description}</td>
                    <td className="px-5 py-4 font-bold text-forest">
                      {categoryProducts.length} product{categoryProducts.length > 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/products/${cat.slug}`}
                        target="_blank"
                        className="rounded-lg border border-forest/20 px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream transition-colors"
                      >
                        View Collection
                      </Link>
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
