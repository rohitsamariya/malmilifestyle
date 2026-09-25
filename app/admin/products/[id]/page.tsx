import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDbProductById } from "@/data/db-products";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const product = await getDbProductById(decodeURIComponent(id), {
    includeInactive: true,
    includeInactiveVariants: true,
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-xs font-semibold text-earth hover:text-forest">
            Back to products
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest">{product.name}</h1>
          <p className="mt-1 text-sm text-earth">{product.slug}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-bold text-forest">Variants</h2>
          <div className="mt-4 space-y-4">
            {product.variants.map((variant) => (
              <div key={variant.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-beige p-4">
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-cream-deep">
                  {variant.image ? (
                    <Image src={variant.image} alt={`${product.name} ${variant.size}`} width={80} height={80} unoptimized className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-40 flex-1">
                  <p className="font-semibold text-forest">{variant.size || "Unnamed variant"}</p>
                  <p className="mt-1 text-xs text-earth">{variant.stock} units · {variant.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="text-right text-sm font-semibold text-forest">
                  <p>{formatPrice(variant.price ?? product.price ?? 0)}</p>
                  {variant.compareAtPrice !== null ? <p className="text-xs text-earth-lighter line-through">{formatPrice(variant.compareAtPrice)}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="rounded-2xl border border-beige bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-bold text-forest">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs text-earth-light">Category</dt><dd className="font-semibold text-forest">{product.category}</dd></div>
            <div><dt className="text-xs text-earth-light">Badge</dt><dd className="font-semibold text-forest">{product.badge || "—"}</dd></div>
            <div><dt className="text-xs text-earth-light">Price</dt><dd className="font-semibold text-forest">{formatPrice(product.price ?? 0)}</dd></div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-earth">{product.description}</p>
        </aside>
      </div>
    </div>
  );
}
