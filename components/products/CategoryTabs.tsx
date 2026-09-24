import Link from "next/link";
import { ALL_TABS } from "@/data/categories";
import type { CategorySlug } from "@/data/types";
import { cn, productsHref } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: CategorySlug;
}

/**
 * Flat category navigation above the grid. Pure links — each tab maps to its
 * own `/products/<slug>` route, so active state comes from the URL path.
 * Horizontally scrollable on mobile, a compact pill row on desktop.
 */
export default function CategoryTabs({ activeCategory }: CategoryTabsProps) {
  return (
    <nav
      aria-label="Filter by category"
      className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-2">
        {ALL_TABS.map((category) => {
          const isActive = category.slug === activeCategory;
          return (
            <li key={category.slug}>
              <Link
                href={productsHref({
                  category: category.slug === "all" ? undefined : category.slug,
                })}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-forest bg-forest text-cream"
                    : "border-beige bg-white text-forest/80 hover:border-earth-light hover:text-forest",
                )}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}