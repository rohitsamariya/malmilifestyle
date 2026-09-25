"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AdminCategory {
  categoryId: string;
  name: string;
  slug: string;
  shortName: string;
  description: string;
  image: string;
  imagePublicId?: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface CategoryForm {
  name: string;
  slug: string;
  shortName: string;
  description: string;
  image: string;
  imagePublicId: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  shortName: "",
  description: "",
  image: "",
  imagePublicId: "",
  isActive: true,
  sortOrder: "0",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
}

export default function AdminCategoriesClient() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/categories?includeInactive=true");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load categories.");
      setCategories(data.categories || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCategories();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCategories]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function openEdit(category: AdminCategory) {
    setEditingId(category.categoryId);
    setForm({
      name: category.name,
      slug: category.slug,
      shortName: category.shortName,
      description: category.description,
      image: category.image || "",
      imagePublicId: category.imagePublicId || "",
      isActive: category.isActive,
      sortOrder: String(category.sortOrder ?? 0),
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save category.");
      setForm(null);
      await fetchCategories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(category: AdminCategory) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/categories/${category.categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update category.");
      await fetchCategories();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update category.");
    }
  }

  async function remove(category: AdminCategory) {
    if (!window.confirm(`Remove ${category.name}?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/categories/${category.categoryId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove category.");
      await fetchCategories();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove category.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Categories ({categories.length})
          </h2>
          <p className="mt-1 text-xs text-earth sm:text-sm">
            Store category taxonomy and catalog visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-cream shadow-md hover:bg-forest/90"
        >
          Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-beige bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-earth">Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-sm text-earth">No categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-forest">
              <thead className="border-b border-beige bg-cream text-[10px] font-bold uppercase tracking-wider text-earth">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Products</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/60">
                {categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td className="px-5 py-4 font-bold">{category.name}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-earth-light">{category.slug}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-earth">{category.description}</td>
                    <td className="px-5 py-4 font-semibold">{category.productCount}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void toggle(category)}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          category.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="rounded-lg border border-forest/20 bg-cream px-3 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-cream"
                        >
                          Edit
                        </button>
                        <Link
                           href={`/admin/categories/${encodeURIComponent(category.slug)}`}
                          target="_blank"
                          className="rounded-lg border border-beige bg-cream-deep px-3 py-1.5 text-[11px] font-bold text-earth hover:text-forest"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => void remove(category)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl border border-beige bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-beige px-6 py-4">
              <h3 className="font-display text-lg font-bold text-forest">
                {editingId ? "Edit Category" : "Add Category"}
              </h3>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-earth hover:bg-cream"
              >
                ×
              </button>
            </div>
            <form onSubmit={save} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <label className="text-xs font-semibold text-forest">
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => current ? {
                      ...current,
                      name,
                      slug: editingId ? current.slug : slugify(name),
                      shortName: current.shortName || name,
                    } : current);
                  }}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2"
                />
              </label>
              <label className="text-xs font-semibold text-forest">
                Slug *
                <input
                  required
                  value={form.slug}
                  onChange={(event) => setForm((current) => current ? { ...current, slug: slugify(event.target.value) } : current)}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2 font-mono"
                />
              </label>
              <label className="text-xs font-semibold text-forest">
                Short Name *
                <input
                  required
                  value={form.shortName}
                  onChange={(event) => setForm((current) => current ? { ...current, shortName: event.target.value } : current)}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2"
                />
              </label>
              <label className="text-xs font-semibold text-forest">
                Sort Order
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => current ? { ...current, sortOrder: event.target.value } : current)}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2"
                />
              </label>
              <label className="text-xs font-semibold text-forest sm:col-span-2">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => current ? { ...current, description: event.target.value } : current)}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2"
                />
              </label>
              <label className="text-xs font-semibold text-forest sm:col-span-2">
                Image URL
                <input
                  type="url"
                  value={form.image}
                  onChange={(event) => setForm((current) => current ? { ...current, image: event.target.value } : current)}
                  className="mt-1 w-full rounded-xl border border-sand px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-forest sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => current ? { ...current, isActive: event.target.checked } : current)}
                />
                Active
              </label>
              <div className="flex justify-end gap-3 border-t border-beige pt-4 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="rounded-xl border border-beige px-5 py-2.5 text-sm font-bold text-earth"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-forest px-6 py-2.5 text-sm font-bold text-cream disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
