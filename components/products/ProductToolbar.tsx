"use client";

export type SortKey = "featured" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

interface ProductToolbarProps {
  count: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

export default function ProductToolbar({ count, sort, onSortChange }: ProductToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-forest/70" aria-live="polite">
        {count} {count === 1 ? "Product" : "Products"}
      </p>
      <label className="flex items-center gap-3 text-sm text-earth-light">
        <span className="hidden sm:inline">Sort by</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="h-10 rounded-full border border-beige bg-white px-4 text-sm font-medium text-forest outline-none transition-colors hover:border-earth-lighter"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}