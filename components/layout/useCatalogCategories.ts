"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/data/types";

export default function useCatalogCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.categories) ? data.categories : [];
      })
      .then((value: Category[]) => {
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
