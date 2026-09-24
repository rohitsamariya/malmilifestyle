"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AdminVariant {
  variantId: string;
  size: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number | string;
  isActive: boolean;
}

interface AdminProduct {
  productId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  images: string[];
  badge: string | null;
  madeWith: string;
  isActive: boolean;
  variants: AdminVariant[];
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { value: "wood-pressed-oils", label: "Wood-Pressed Oils" },
  { value: "wheat-atta", label: "Wheat Atta" },
  { value: "multigrain-atta", label: "Multigrain Atta" },
  { value: "millet-atta", label: "Millet Atta" },
];

const MADE_WITH_OPTIONS = ["Wood-Pressed", "Stone-Ground"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function emptyVariant(): AdminVariant {
  return {
    variantId: "",
    size: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    isActive: true,
  };
}

function emptyProduct(): Omit<AdminProduct, "productId" | "price" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    slug: "",
    category: "wood-pressed-oils",
    description: "",
    images: [""],
    badge: "",
    madeWith: "Wood-Pressed",
    isActive: true,
    variants: [emptyVariant()],
  };
}

function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function totalStock(variants: AdminVariant[]): number {
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

// ---------------------------------------------------------------------------
// Variant Row inside modal
// ---------------------------------------------------------------------------
function VariantRow({
  variant,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  variant: AdminVariant;
  index: number;
  onChange: (idx: number, field: keyof AdminVariant, value: string | boolean) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="rounded-xl border border-beige bg-cream/40 p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-earth">
          Variant {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={variant.isActive}
              onChange={(e) => onChange(index, "isActive", e.target.checked)}
              className="accent-forest"
            />
            <span className="text-[11px] text-earth font-medium">Active</span>
          </label>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Size *</label>
          <input
            type="text"
            placeholder="e.g. 500 ML"
            value={variant.size}
            onChange={(e) => onChange(index, "size", e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Selling Price ₹ *</label>
          <input
            type="number"
            placeholder="e.g. 269"
            min={0}
            value={variant.price}
            onChange={(e) => onChange(index, "price", e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">MRP ₹ (Compare At)</label>
          <input
            type="number"
            placeholder="e.g. 329"
            min={0}
            value={variant.compareAtPrice ?? ""}
            onChange={(e) => onChange(index, "compareAtPrice", e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Stock *</label>
          <input
            type="number"
            placeholder="e.g. 100"
            min={0}
            value={variant.stock}
            onChange={(e) => onChange(index, "stock", e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Form (shared by Add + Edit modals)
// ---------------------------------------------------------------------------
function ProductForm({
  initial,
  onSave,
  onCancel,
  mode,
}: {
  initial: Partial<AdminProduct>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<ReturnType<typeof emptyProduct>>(() => ({
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    category: initial.category ?? "wood-pressed-oils",
    description: initial.description ?? "",
    images: initial.images?.length ? initial.images : [""],
    badge: initial.badge ?? "",
    madeWith: initial.madeWith ?? "Wood-Pressed",
    isActive: initial.isActive !== false,
    variants: initial.variants?.length
      ? initial.variants.map((v) => ({
          variantId: v.variantId ?? "",
          size: v.size ?? "",
          price: v.price ?? "",
          compareAtPrice: v.compareAtPrice ?? "",
          stock: v.stock ?? "",
          isActive: v.isActive !== false,
        }))
      : [emptyVariant()],
  }));

  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name (only in Add mode and if not manually edited)
  useEffect(() => {
    if (mode === "add" && !slugManual) {
      setForm((prev) => ({ ...prev, slug: autoSlug(prev.name) }));
    }
  }, [form.name, mode, slugManual]);

  function handleField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleVariantChange(idx: number, field: keyof AdminVariant, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));
  }

  function addVariant() {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }));
  }

  function removeVariant(idx: number) {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  }

  function removeImageField(idx: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  function handleImageChange(idx: number, value: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === idx ? value : img)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        images: form.images.filter(Boolean),
        badge: form.badge || null,
        variants: form.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice !== "" && v.compareAtPrice !== null ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock),
        })),
      };
      await onSave(payload);
    } catch (err: any) {
      setError(err.message ?? "An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Product Name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => handleField("name", e.target.value)}
            placeholder="e.g. Virgin Groundnut Oil"
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Slug *</label>
          <input
            required
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              handleField("slug", e.target.value);
            }}
            placeholder="e.g. virgin-groundnut-oil"
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => handleField("category", e.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Made With *</label>
          <select
            required
            value={form.madeWith}
            onChange={(e) => handleField("madeWith", e.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
          >
            {MADE_WITH_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-earth mb-1">Badge (optional)</label>
          <input
            type="text"
            value={form.badge ?? ""}
            onChange={(e) => handleField("badge", e.target.value)}
            placeholder="e.g. Best Seller, New"
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => handleField("isActive", !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isActive ? "bg-forest" : "bg-sand"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm font-semibold text-forest">
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-earth mb-1">Description *</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => handleField("description", e.target.value)}
          placeholder="Product description..."
          className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none resize-none"
        />
      </div>

      {/* Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase text-earth">Product Images (URLs)</label>
          <button
            type="button"
            onClick={addImageField}
            className="text-[11px] font-bold text-forest hover:underline"
          >
            + Add Image URL
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {form.images.map((img, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="url"
                value={img}
                onChange={(e) => handleImageChange(idx, e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none"
              />
              {form.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(idx)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-bold uppercase text-earth">
            Variants / Sizes ({form.variants.length})
          </label>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-lg border border-forest/20 bg-cream px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream transition-colors"
          >
            + Add Variant
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.variants.map((v, idx) => (
            <VariantRow
              key={idx}
              variant={v}
              index={idx}
              onChange={handleVariantChange}
              onRemove={removeVariant}
              canRemove={form.variants.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-beige pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-beige px-5 py-2.5 text-sm font-bold text-earth hover:bg-cream transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-forest px-6 py-2.5 text-sm font-bold text-cream hover:bg-forest/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "add" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Modal wrapper
// ---------------------------------------------------------------------------
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8">
      <div className="relative w-full max-w-3xl rounded-2xl border border-beige bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-beige px-6 py-4">
          <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-earth hover:bg-cream hover:text-forest transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deactivate / Delete Confirmation Modal
// ---------------------------------------------------------------------------
function ConfirmModal({
  product,
  onConfirm,
  onCancel,
}: {
  product: AdminProduct;
  onConfirm: (hardDelete: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(hardDelete: boolean) {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(hardDelete);
    } catch (err: any) {
      setError(err.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Manage: ${product.name}`} onClose={onCancel}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-earth">
          Choose how to handle <span className="font-bold text-forest">{product.name}</span>:
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠ Deactivate (Recommended)</p>
          <p className="text-xs text-amber-700">
            The product will be hidden from the storefront but preserved in the database, including all historical order references.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-800 mb-1">🗑 Permanently Delete</p>
          <p className="text-xs text-red-700">
            Only allowed if no historical orders reference this product. If orders exist, the product will be deactivated instead. This action cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-beige px-4 py-2.5 text-sm font-bold text-earth hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handle(false)}
            disabled={loading}
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            {loading ? "Working…" : "Deactivate"}
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Working…" : "Permanently Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Products Client Component
// ---------------------------------------------------------------------------
export default function AdminProductsClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<AdminProduct | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  // ---------------------------------------------------------------------------
  // Fetch products from admin API
  // ---------------------------------------------------------------------------
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch products.");
      setProducts(data.products ?? []);
    } catch (err: any) {
      setFetchError(err.message ?? "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  // ---------------------------------------------------------------------------
  // Add product
  // ---------------------------------------------------------------------------
  async function handleAdd(payload: any) {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create product.");
    setShowAdd(false);
    showToast("Product created successfully! 🎉");
    fetchProducts();
  }

  // ---------------------------------------------------------------------------
  // Edit product
  // ---------------------------------------------------------------------------
  async function handleEdit(payload: any) {
    if (!editProduct) return;
    const res = await fetch(`/api/admin/products/${editProduct.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update product.");
    setEditProduct(null);
    showToast("Product updated successfully! ✅");
    fetchProducts();
  }

  // ---------------------------------------------------------------------------
  // Toggle active/inactive
  // ---------------------------------------------------------------------------
  async function handleToggleActive(product: AdminProduct) {
    const res = await fetch(`/api/admin/products/${product.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to update status.", false);
      return;
    }
    showToast(
      product.isActive ? "Product deactivated." : "Product activated! ✅",
      !product.isActive
    );
    fetchProducts();
  }

  // ---------------------------------------------------------------------------
  // Delete / deactivate
  // ---------------------------------------------------------------------------
  async function handleConfirmDelete(hardDelete: boolean) {
    if (!confirmProduct) return;
    const url = `/api/admin/products/${confirmProduct.productId}${hardDelete ? "?hardDelete=true" : ""}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to process request.");
    setConfirmProduct(null);
    showToast(data.message || "Done.");
    fetchProducts();
  }

  // ---------------------------------------------------------------------------
  // Computed display values
  // ---------------------------------------------------------------------------
  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-5 py-3.5 shadow-xl text-sm font-semibold transition-all ${
            toast.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Product Catalog
          </h2>
          <p className="mt-1 text-xs text-earth">
            {products.length} product{products.length !== 1 ? "s" : ""} —{" "}
            <span className="text-emerald-700 font-semibold">{activeCount} active</span>
            {inactiveCount > 0 && (
              <span className="text-amber-700 font-semibold">, {inactiveCount} inactive</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-cream shadow-md hover:bg-forest/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-beige bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, slug, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 pl-9 pr-4 py-2.5 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {fetchError}
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-earth">
            <svg className="mr-2 h-5 w-5 animate-spin text-forest" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-earth">
            <svg className="h-12 w-12 text-sand mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm font-semibold">No products found.</p>
            <p className="text-xs mt-1 text-earth-lighter">Try adjusting filters or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-beige bg-cream text-[10px] font-bold uppercase tracking-wider text-earth">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-center">Variants</th>
                  <th className="px-5 py-3.5">Price Range</th>
                  <th className="px-5 py-3.5 text-center">Stock</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/60">
                {products.map((product) => {
                  const prices = product.variants.map((v) => Number(v.price)).filter((p) => !isNaN(p));
                  const minP = prices.length ? Math.min(...prices) : product.price;
                  const maxP = prices.length ? Math.max(...prices) : product.price;
                  const stock = totalStock(product.variants);
                  const cat = CATEGORIES.find((c) => c.value === product.category);

                  return (
                    <tr key={product.productId} className="group hover:bg-cream/30 transition-colors">
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-beige bg-cream-deep">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={44}
                                height={44}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-earth-lighter text-lg">📦</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-forest">{product.name}</p>
                            <p className="text-[10px] text-earth-light font-mono">{product.slug}</p>
                            {product.badge && (
                              <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                                {product.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-5 py-4 text-earth font-medium">
                        {cat?.label ?? product.category}
                      </td>
                      {/* Variants */}
                      <td className="px-5 py-4 text-center font-semibold text-forest">
                        {product.variants.length}
                        <span className="block text-[10px] font-normal text-earth-lighter">
                          {product.variants.filter((v) => v.isActive).length} active
                        </span>
                      </td>
                      {/* Price Range */}
                      <td className="px-5 py-4 font-bold text-forest">
                        {minP === maxP ? formatPrice(minP) : `${formatPrice(minP)} – ${formatPrice(maxP)}`}
                      </td>
                      {/* Stock */}
                      <td className="px-5 py-4 text-center">
                        <span className={`font-bold ${stock === 0 ? "text-red-600" : stock < 10 ? "text-amber-600" : "text-forest"}`}>
                          {stock}
                        </span>
                        <span className="block text-[10px] text-earth-lighter">units</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          title={product.isActive ? "Click to deactivate" : "Click to activate"}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                            product.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditProduct(product)}
                            className="rounded-lg border border-forest/20 bg-cream px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream transition-colors"
                          >
                            Edit
                          </button>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="rounded-lg border border-beige bg-cream-deep px-3 py-1.5 text-[11px] font-bold text-earth hover:text-forest transition-colors"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmProduct(product)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Add Modal ---- */}
      {showAdd && (
        <Modal title="Add New Product" onClose={() => setShowAdd(false)}>
          <ProductForm
            mode="add"
            initial={emptyProduct()}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* ---- Edit Modal ---- */}
      {editProduct && (
        <Modal title={`Edit: ${editProduct.name}`} onClose={() => setEditProduct(null)}>
          <ProductForm
            mode="edit"
            initial={editProduct}
            onSave={handleEdit}
            onCancel={() => setEditProduct(null)}
          />
        </Modal>
      )}

      {/* ---- Confirm Delete Modal ---- */}
      {confirmProduct && (
        <ConfirmModal
          product={confirmProduct}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmProduct(null)}
        />
      )}
    </div>
  );
}
