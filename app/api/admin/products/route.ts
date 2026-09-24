import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";

/**
 * GET /api/admin/products
 * Admin-only: returns ALL products (active + inactive) for the admin panel.
 * Supports ?search=, ?category=, ?status=active|inactive|all
 */
export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") ?? "all"; // active | inactive | all

    await connectToDatabase();

    const filter: Record<string, any> = {};

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    // "all" → no isActive filter

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const docs = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ products: docs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products.";
    return NextResponse.json({ error: message, products: [] }, { status: 500 });
  }
}
