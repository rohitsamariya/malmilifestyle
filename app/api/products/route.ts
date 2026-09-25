import { NextResponse } from "next/server";
import { getDbProducts } from "@/data/db-products";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { createProduct, errorResponse } from "@/lib/product-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || searchParams.get("categorySlug");
    const search = searchParams.get("search");

    const products = await getDbProducts({ category: category ?? undefined, query: search ?? undefined });
    return NextResponse.json({ products });
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
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const response = errorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
