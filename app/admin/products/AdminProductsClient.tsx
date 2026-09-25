"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface AdminVariant {
  variantId: string;
  size: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number | string;
  isActive: boolean;
  image: string | null;
  imagePublicId: string | null;
  id?: string;
}

interface AdminProduct {
  productId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  badge: string | null;
  isActive: boolean;
  variants: AdminVariant[];
  price: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminCategory {
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

type ProductFormState = Omit<
  AdminProduct,
  "productId" | "price" | "createdAt" | "updatedAt"
>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function newVariantId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `variant-${crypto.randomUUID()}`;
  }
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyVariant(): AdminVariant {
  return {
    variantId: newVariantId(),
    size: "",
    price: "",
    compareAtPrice: "",
    stock: 0,
    isActive: true,
    image: null,
    imagePublicId: null,
  };
}

function emptyProduct(category = ""): ProductFormState {
  return {
    name: "",
    slug: "",
    category,
    description: "",
    badge: "",
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
  return variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
}

function VariantImageField({
  image,
  uploading,
  onUpload,
  onRemove,
}: {
  image: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-1 flex items-center gap-3 sm:col-span-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sand bg-cream-deep">
        {image ? (
          <Image
            src={image}
            alt="Variant preview"
            width={64}
            height={64}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-earth-light">No image</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-forest/20 bg-white px-3 py-2 text-[11px] font-bold text-forest hover:bg-cream">
          {uploading ? "Uploading…" : image ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onUpload(file);
            }}
          />
        </label>
        {image ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-100"
          >
            Remove
          </button>
        ) : null}
        <span className="text-[10px] text-earth-light">JPG, PNG or WEBP up to 5 MB</span>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  index,
  productSlug,
  uploading,
  onChange,
  onImageUpload,
  onImageRemove,
  onRemove,
  canRemove,
}: {
  variant: AdminVariant;
  index: number;
  productSlug: string;
  uploading: boolean;
  onChange: (index: number, field: keyof AdminVariant, value: string | boolean | null) => void;
  onImageUpload: (index: number, file: File) => Promise<void>;
  onImageRemove: (index: number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-beige bg-cream/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-earth">
          Variant {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={variant.isActive}
              onChange={(event) => onChange(index, "isActive", event.target.checked)}
              className="accent-forest"
            />
            <span className="text-[11px] font-medium text-earth">Active</span>
          </label>
          {canRemove ? (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Size *</label>
          <input
            type="text"
            placeholder="e.g. 500 ML"
            value={variant.size}
            onChange={(event) => onChange(index, "size", event.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest placeholder:text-earth-lighter focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Selling Price *</label>
          <input
            type="number"
            min={0}
            value={variant.price}
            onChange={(event) => onChange(index, "price", event.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">MRP</label>
          <input
            type="number"
            min={0}
            value={variant.compareAtPrice ?? ""}
            onChange={(event) => onChange(index, "compareAtPrice", event.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest focus:border-forest focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Stock *</label>
          <input
            type="number"
            min={0}
            value={variant.stock}
            onChange={(event) => onChange(index, "stock", event.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs text-forest focus:border-forest focus:outline-none"
          />
        </div>
      </div>
      <VariantImageField
        image={variant.image ?? null}
        uploading={uploading}
        onUpload={(file) => void onImageUpload(index, file)}
        onRemove={() => onImageRemove(index)}
      />
      <input
        type="hidden"
        value={productSlug}
        readOnly
      />
    </div>
  );
}

function ProductForm({
  initial,
  categories,
  onSave,
  onCancel,
  mode,
}: {
  initial: Partial<AdminProduct>;
  categories: AdminCategory[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<ProductFormState>(() => ({
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    category: initial.category ?? categories[0]?.slug ?? "",
    description: initial.description ?? "",
    badge: initial.badge ?? "",
    isActive: initial.isActive !== false,
    variants: initial.variants?.length
      ? initial.variants.map((variant) => ({
          variantId: variant.variantId ?? variant.id ?? "",
          size: variant.size ?? "",
          price: variant.price ?? "",
          compareAtPrice: variant.compareAtPrice ?? "",
          stock: variant.stock ?? 0,
          isActive: variant.isActive !== false,
          image: variant.image ?? null,
          imagePublicId: variant.imagePublicId ?? null,
        }))
      : [emptyVariant()],
  }));
  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState<number | null>(null);

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      ...(mode === "add" && !slugManual ? { slug: autoSlug(value) } : {}),
    }));
  }

  function handleField(field: keyof ProductFormState, value: string | boolean) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleVariantChange(index: number, field: keyof AdminVariant, value: string | boolean | null) {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  function addVariant() {
    setForm((previous) => ({ ...previous, variants: [...previous.variants, emptyVariant()] }));
  }

  function removeVariant(index: number) {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleVariantImageUpload(index: number, file: File) {
    const variant = form.variants[index];
    if (!variant) return;
    setUploadingVariant(index);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("productSlug", form.slug || "product");
      body.append("variantId", variant.variantId || `variant-${index + 1}`);
      const response = await fetch("/api/admin/images", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload image.");
      handleVariantChange(index, "image", data.url);
      handleVariantChange(index, "imagePublicId", data.publicId || null);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Failed to upload image."));
    } finally {
      setUploadingVariant(null);
    }
  }

  function handleVariantImageRemove(index: number) {
    handleVariantChange(index, "image", null);
    handleVariantChange(index, "imagePublicId", null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        badge: form.badge || null,
        isActive: form.isActive,
        variants: form.variants.map((variant) => ({
          variantId: variant.variantId,
          size: variant.size,
          price: Number(variant.price),
          compareAtPrice:
            variant.compareAtPrice !== "" && variant.compareAtPrice !== null
              ? Number(variant.compareAtPrice)
              : null,
          stock: Number(variant.stock),
          isActive: variant.isActive,
          image: variant.image || null,
          imagePublicId: variant.imagePublicId || null,
        })),
      });
    } catch (saveError) {
      setError(errorMessage(saveError, "An error occurred."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Product Name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(event) => handleNameChange(event.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Slug *</label>
          <input
            required
            type="text"
            value={form.slug}
            onChange={(event) => {
              setSlugManual(true);
              handleField("slug", event.target.value);
            }}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm font-mono text-forest focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Category *</label>
          <select
            required
            value={form.category}
            onChange={(event) => handleField("category", event.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category.categoryId} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Badge (optional)</label>
          <input
            type="text"
            value={form.badge ?? ""}
            onChange={(event) => handleField("badge", event.target.value)}
            className="w-full rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => handleField("isActive", event.target.checked)}
              className="accent-forest"
            />
            <span className="text-sm font-semibold text-forest">
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </label>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase text-earth">Description *</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(event) => handleField("description", event.target.value)}
          className="w-full resize-none rounded-xl border border-sand bg-cream-deep/30 px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:bg-white focus:outline-none"
        />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase text-earth">
            Variants / Sizes ({form.variants.length})
          </label>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-lg border border-forest/20 bg-cream px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream"
          >
            + Add Variant
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.variants.map((variant, index) => (
            <VariantRow
              key={index}
              variant={variant}
              index={index}
              productSlug={form.slug}
              uploading={uploadingVariant === index}
              onChange={handleVariantChange}
              onImageUpload={handleVariantImageUpload}
              onImageRemove={handleVariantImageRemove}
              onRemove={removeVariant}
              canRemove={form.variants.length > 1}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-3 border-t border-beige pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-beige px-5 py-2.5 text-sm font-bold text-earth hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploadingVariant !== null}
          className="rounded-xl bg-forest px-6 py-2.5 text-sm font-bold text-cream hover:bg-forest/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "add" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-beige bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-beige px-6 py-4">
          <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-earth hover:bg-cream hover:text-forest"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

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
    } catch (deleteError) {
      setError(errorMessage(deleteError, "An error occurred."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Manage: ${product.name}`} onClose={onCancel}>
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <p className="text-sm text-earth">
          Choose how to handle <span className="font-bold text-forest">{product.name}</span>.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
          Deactivate hides the product from the storefront and preserves its records.
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          Permanent deletion is allowed only when no historical orders reference the product.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-beige px-4 py-2.5 text-sm font-bold text-earth"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handle(false)}
            disabled={loading}
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800"
          >
            Deactivate
          </button>
          <button
            type="button"
            onClick={() => void handle(true)}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminProductsClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<AdminProduct | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 4000);
  }

  const fetchCategories = useCallback(async () => {
    const response = await fetch("/api/admin/categories?includeInactive=true");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch categories.");
    setCategories(data.categories || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch products.");
      setProducts(data.products || []);
    } catch (error) {
      setFetchError(errorMessage(error, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCategories().catch((error: unknown) => {
        setFetchError(errorMessage(error, "Failed to load categories."));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchProducts(), 300);
    return () => window.clearTimeout(timer);
  }, [fetchProducts]);

  async function handleAdd(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create product.");
    setShowAdd(false);
    showToast("Product created successfully.");
    void fetchProducts();
  }

  async function handleEdit(payload: Record<string, unknown>) {
    if (!editProduct) return;
    const response = await fetch(`/api/admin/products/${editProduct.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update product.");
    setEditProduct(null);
    showToast("Product updated successfully.");
    void fetchProducts();
  }

  async function handleToggleActive(product: AdminProduct) {
    const response = await fetch(`/api/admin/products/${product.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Failed to update status.", false);
      return;
    }
    showToast(product.isActive ? "Product deactivated." : "Product activated.");
    void fetchProducts();
  }

  async function handleConfirmDelete(hardDelete: boolean) {
    if (!confirmProduct) return;
    const response = await fetch(
      `/api/admin/products/${confirmProduct.productId}${hardDelete ? "?hardDelete=true" : ""}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to process request.");
    setConfirmProduct(null);
    showToast(data.message || "Done.");
    void fetchProducts();
  }

  const activeCount = products.filter((product) => product.isActive).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="space-y-6">
      {toast ? (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-3.5 shadow-xl text-sm font-semibold ${
          toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {toast.msg}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">Product Catalog</h2>
          <p className="mt-1 text-xs text-earth">
            {products.length} products — <span className="font-semibold text-emerald-700">{activeCount} active</span>
            {inactiveCount > 0 ? <span className="ml-1 font-semibold text-amber-700">{inactiveCount} inactive</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-cream shadow-md hover:bg-forest/90"
        >
          + Add Product
        </button>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-beige bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by name, slug, or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => <option key={category.categoryId} value={category.slug}>{category.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-sand bg-cream-deep/30 px-4 py-2.5 text-xs text-forest focus:border-forest focus:bg-white focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      {fetchError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{fetchError}</div> : null}
      <div className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-earth">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-sm text-earth">No products found.</div>
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
                  const prices = product.variants.map((variant) => Number(variant.price)).filter((price) => !Number.isNaN(price));
                  const minPrice = prices.length ? Math.min(...prices) : product.price || 0;
                  const maxPrice = prices.length ? Math.max(...prices) : product.price || 0;
                  const category = categories.find((item) => item.slug === product.category);
                  const image = product.variants.find((variant) => variant.isActive)?.image || product.variants[0]?.image;
                  return (
                    <tr key={product.productId} className="hover:bg-cream/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-beige bg-cream-deep">
                            {image ? <Image src={image} alt={product.name} width={44} height={44} unoptimized className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-earth-light">—</span>}
                          </div>
                          <div>
                            <p className="font-bold text-forest">{product.name}</p>
                            <p className="font-mono text-[10px] text-earth-light">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-earth">{category?.name || product.category}</td>
                      <td className="px-5 py-4 text-center font-semibold text-forest">
                        {product.variants.length}
                        <span className="block text-[10px] font-normal text-earth-light">{product.variants.filter((variant) => variant.isActive).length} active</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-forest">{minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}</td>
                      <td className="px-5 py-4 text-center font-bold text-forest">{totalStock(product.variants)}</td>
                      <td className="px-5 py-4 text-center">
                        <button type="button" onClick={() => void handleToggleActive(product)} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${product.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => setEditProduct(product)} className="rounded-lg border border-forest/20 bg-cream px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream">Edit</button>
                          <Link href={`/admin/products/${encodeURIComponent(product.productId)}`} className="rounded-lg border border-beige bg-cream-deep px-3 py-1.5 text-[11px] font-bold text-earth hover:text-forest">View</Link>
                          <button type="button" onClick={() => setConfirmProduct(product)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100">Delete</button>
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
      {showAdd ? (
        <Modal title="Add New Product" onClose={() => setShowAdd(false)}>
          <ProductForm mode="add" categories={categories} initial={emptyProduct(categories[0]?.slug)} onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      ) : null}
      {editProduct ? (
        <Modal title={`Edit: ${editProduct.name}`} onClose={() => setEditProduct(null)}>
          <ProductForm mode="edit" categories={categories} initial={editProduct} onSave={handleEdit} onCancel={() => setEditProduct(null)} />
        </Modal>
      ) : null}
      {confirmProduct ? <ConfirmModal product={confirmProduct} onConfirm={handleConfirmDelete} onCancel={() => setConfirmProduct(null)} /> : null}
    </div>
  );
}
