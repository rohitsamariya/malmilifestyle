import type { Category } from "./types";
import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";

export const ALL_PRODUCTS_CATEGORY: Category = {
  slug: "all",
  name: "All Products",
  shortName: "All",
  description: "Everything from Malmi under one roof.",
};

function shortName(name: string): string {
  return name.replace(/Atta/g, "").trim() || name;
}

function mapDocToCategory(doc: {
  categoryId?: string;
  name?: string;
  shortName?: string;
  slug?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Category {
  return {
    categoryId: doc.categoryId,
    slug: (doc.slug || "") as Category["slug"],
    name: doc.name || "",
    shortName: doc.shortName || shortName(doc.name || ""),
    description: doc.description || "",
    image: doc.image || null,
    imagePublicId: doc.imagePublicId || null,
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export async function getDbCategories({
  includeInactive = false,
}: {
  includeInactive?: boolean;
} = {}): Promise<Category[]> {
  await connectToDatabase();
  const filter = includeInactive ? {} : { isActive: true };
  const docs = await CategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return docs.map(mapDocToCategory);
}

export async function getDbCategory(slug: string): Promise<Category | null> {
  if (!slug || slug === "all") {
    return null;
  }

  await connectToDatabase();
  const doc = await CategoryModel.findOne({ slug, isActive: true }).lean();
  return doc ? mapDocToCategory(doc) : null;
}
