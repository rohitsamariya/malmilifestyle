import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDbCategories } from "@/data/db-categories";
import { getDbProducts } from "@/data/db-products";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPage();
  const { slug } = await params;
  const categories = await getDbCategories({ includeInactive: true });
  const category = categories.find((item) => item.slug === decodeURIComponent(slug));
  if (!category) notFound();
  const products = await getDbProducts({
    category: category.slug,
    includeInactive: true,
    includeInactiveVariants: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/categories" className="text-xs font-semibold text-earth hover:text-forest">
          Back to categories
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {category.image ? <Image src={category.image} alt={category.name} width={64} height={64} unoptimized className="h-16 w-16 rounded-xl object-cover" /> : null}
          <div>
            <h1 className="font-display text-3xl font-bold text-forest">{category.name}</h1>
            <p className="mt-1 text-sm text-earth">{category.slug}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {category.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-earth">{category.description}</p>
      </div>
      <section className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="font-display text-xl font-bold text-forest">Products ({products.length})</h2>
        </div>
        {products.length ? (
          <div className="divide-y divide-beige/60">
            {products.map((product) => {
              const image = product.variants.find((variant) => variant.isActive)?.image || product.variants[0]?.image;
              return (
                <Link key={product.id} href={`/admin/products/${encodeURIComponent(product.productId || product.id)}`} className="flex items-center gap-4 px-5 py-4 hover:bg-cream/30">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-beige bg-cream-deep">
                    {image ? <Image src={image} alt={product.name} width={48} height={48} unoptimized className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-forest">{product.name}</p>
                    <p className="text-xs text-earth">{product.variants.length} variants · {product.variants.filter((variant) => variant.isActive).length} active</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-forest">{formatPrice(product.price ?? 0)}</div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : <p className="px-5 py-10 text-sm text-earth">No products in this category.</p>}
      </section>
    </div>
  );
}
