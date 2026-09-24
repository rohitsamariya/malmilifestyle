"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/types";
import { getCategory } from "@/data/categories";
import { formatPrice } from "@/lib/utils";

interface AdminProductsClientProps {
  products: Product[];
}

export default function AdminProductsClient({ products }: AdminProductsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.slug.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Products Catalog ({products.length})
          </h2>
          <p className="mt-1 text-xs text-earth sm:text-sm">
            Manage storefront product listings, package sizes, MRP and selling pricing.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-beige bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="wood-pressed-oils">Wood-Pressed Oils</option>
          <option value="wheat-atta">Wheat Atta</option>
          <option value="multigrain-atta">Multigrain Atta</option>
          <option value="millet-atta">Millet Atta</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-forest">
            <thead className="bg-cream text-[10px] uppercase font-bold tracking-wider text-earth border-b border-beige">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Variants</th>
                <th className="px-5 py-3.5">Price Range</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60">
              {filteredProducts.map((product) => {
                const category = getCategory(product.category);
                const prices = product.variants.map((v) => v.price).filter((p): p is number => p !== null);
                const minPrice = prices.length ? Math.min(...prices) : product.price;
                const maxPrice = prices.length ? Math.max(...prices) : product.price;
                const isExpanded = expandedProductId === product.id;

                return (
                  <tr key={product.id} className="group hover:bg-cream/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-beige bg-cream-deep">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-forest">{product.name}</p>
                          <p className="text-[10px] text-earth-light">Slug: {product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-earth">{category.name}</td>
                    <td className="px-5 py-4 font-semibold text-forest">
                      {product.variants.length} package size{product.variants.length > 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-4 font-bold text-forest">
                      {minPrice !== null && maxPrice !== null
                        ? minPrice === maxPrice
                          ? formatPrice(minPrice)
                          : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          className="rounded-lg border border-forest/20 px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-cream transition-colors"
                        >
                          {isExpanded ? "Hide Variants" : "View Variants"}
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="rounded-lg border border-beige bg-cream-deep px-3 py-1.5 text-[11px] font-bold text-earth hover:text-forest transition-colors"
                        >
                          View Live PDP
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Variant Modal / Section */}
      {expandedProductId && (
        <div className="rounded-2xl border border-forest/20 bg-cream-deep/40 p-6 shadow-md">
          {(() => {
            const product = products.find((p) => p.id === expandedProductId);
            if (!product) return null;
            return (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-beige">
                  <h3 className="font-bold text-forest">
                    Variants Breakdown: <span className="font-semibold text-earth">{product.name}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setExpandedProductId(null)}
                    className="text-xs font-bold text-earth hover:text-forest"
                  >
                    Close &times;
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {product.variants.map((v) => (
                    <div key={v.id} className="rounded-xl border border-beige bg-white p-4 text-xs shadow-sm">
                      <p className="font-bold text-forest text-sm">{v.size}</p>
                      <p className="mt-1 text-[10px] text-earth-lighter">SKU ID: {v.id}</p>
                      <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-beige/60">
                        <span className="text-earth-light">
                          MRP: <span className="line-through">{v.compareAtPrice ? formatPrice(v.compareAtPrice) : "—"}</span>
                        </span>
                        <span className="font-bold text-forest text-sm">
                          {v.price ? formatPrice(v.price) : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
