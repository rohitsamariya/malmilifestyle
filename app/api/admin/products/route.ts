import { NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import { mapProductDocument } from "@/data/db-products";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { createProduct, errorResponse } from "@/lib/product-service";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || searchParams.get("categorySlug");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";
    const conditions: Record<string, unknown>[] = [];

    if (status === "active") conditions.push({ isActive: true });
    if (status === "inactive") conditions.push({ isActive: false });
    if (category && category !== "all") {
      conditions.push({ $or: [{ categorySlug: category }, { category: category }] });
    }
    if (search?.trim()) {
      const pattern = new RegExp(escapeRegExp(search.trim()), "i");
      conditions.push({
        $or: [
          { name: pattern },
          { slug: pattern },
          { description: pattern },
          { categorySlug: pattern },
        ],
      });
    }

    await connectToDatabase();
    const filter = (conditions.length ? { $and: conditions } : {}) as QueryFilter<unknown>;
    const products = await ProductModel.find(filter)
      .sort({ createdAt: 1, productId: 1 })
      .lean();
    return NextResponse.json({ products: products.map((product) => mapProductDocument(product, { includeInactiveVariants: true })) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products.";
    return NextResponse.json({ error: message, products: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const product = await createProduct(await request.json());
    return NextResponse.json({ product: mapProductDocument(product) }, { status: 201 });
  } catch (error) {
    const response = errorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
