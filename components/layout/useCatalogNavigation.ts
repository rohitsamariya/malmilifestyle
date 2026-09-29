"use client";

import { useEffect, useState } from "react";
import type { NavCategory } from "@/data/db-navigation";

/**
 * Loads the navbar's navigation model: the active categories, each with its
 * active base products. Inactive categories, products and variants are already
 * filtered out server-side, so nothing customer-inactive can reach the navbar.
 */
export default function useCatalogNavigation(): NavCategory[] {
  const [categories, setCategories] = useState<NavCategory[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/navigation")
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.categories) ? data.categories : [];
      })
      .then((value: NavCategory[]) => {
        if (active) setCategories(value);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
