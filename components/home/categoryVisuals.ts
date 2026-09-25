import type { Category } from "@/data/types";

export const CATEGORY_BANNERS: Record<string, string> = {
  "wood-pressed-oils": "/images/categories/wood-pressed-oils.svg",
  "wheat-atta": "/images/categories/wheat-atta.svg",
  "multigrain-atta": "/images/categories/multigrain-atta.svg",
  "millet-atta": "/images/categories/millet-atta.svg",
};

export function getCategoryBanner(category: Category): string {
  return category.image || CATEGORY_BANNERS[category.slug] || "/images/hero-visual.svg";
}
