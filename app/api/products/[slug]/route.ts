import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import type { Product } from "@/data/types";

function mapDocToProduct(doc: any): Product {
  return {
    id: doc.productId || doc.id,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    images: doc.images,
    variants: (doc.variants || [])
      .filter((v: any) => v.isActive !== false)
      .map((v: any) => ({
        id: v.variantId || v.id,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
      })),
    rating: doc.rating ?? null,
    reviewCount: doc.reviewCount ?? null,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice ?? null,
    badge: doc.badge ?? null,
    madeWith: doc.madeWith,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    await connectToDatabase();

    const doc = await ProductModel.findOne({ slug, isActive: true }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product: Product = mapDocToProduct(doc);
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
