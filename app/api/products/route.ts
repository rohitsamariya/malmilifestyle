import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { nanoid } from "nanoid";
import type { Product } from "@/data/types";

// ---------------------------------------------------------------------------
// Shape mapper — converts Mongoose doc → storefront Product type
// ---------------------------------------------------------------------------
function mapDocToProduct(doc: any): Product {
  return {
    id: doc.productId,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    images: doc.images ?? [],
    variants: (doc.variants ?? [])
      .filter((v: any) => v.isActive !== false)
      .map((v: any) => ({
        id: v.variantId,
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

// ---------------------------------------------------------------------------
// GET /api/products — public, returns active products
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";

    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }

    const docs = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();
    const products: Product[] = docs.map(mapDocToProduct);

    return NextResponse.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products.";
    return NextResponse.json({ error: message, products: [] }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/products — admin-only, creates a new product
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await request.json();

    // ---- server-side validation ----
    const errors: string[] = [];

    const name = (body.name ?? "").trim();
    const slug = (body.slug ?? "").trim();
    const category = (body.category ?? "").trim();
    const description = (body.description ?? "").trim();
    const images: string[] = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    const badge = (body.badge ?? "").trim() || null;
    const madeWith = body.madeWith ?? "Wood-Pressed";
    const isActive = body.isActive !== false;
    const variants = Array.isArray(body.variants) ? body.variants : [];

    const ALLOWED_CATEGORIES = [
      "wood-pressed-oils",
      "wheat-atta",
      "multigrain-atta",
      "millet-atta",
    ];
    const ALLOWED_MADE_WITH = ["Wood-Pressed", "Stone-Ground"];

    if (!name) errors.push("Product name is required.");
    if (!slug) errors.push("Slug is required.");
    if (!category || !ALLOWED_CATEGORIES.includes(category))
      errors.push("A valid category is required.");
    if (!description) errors.push("Description is required.");
    if (!ALLOWED_MADE_WITH.includes(madeWith))
      errors.push("madeWith must be 'Wood-Pressed' or 'Stone-Ground'.");

    // Variant validation
    if (!variants.length) errors.push("At least one variant is required.");
    const variantSizes = new Set<string>();
    const variantIds = new Set<string>();
    const mappedVariants = variants.map((v: any) => {
      const size = (v.size ?? "").trim();
      const price = Number(v.price);
      const compareAtPrice = v.compareAtPrice != null ? Number(v.compareAtPrice) : null;
      const stock = Number(v.stock ?? 0);
      const variantActive = v.isActive !== false;
      const variantId = (v.variantId ?? "").trim() || `v-${nanoid(8)}`;

      if (!size) errors.push("Each variant must have a size.");
      if (isNaN(price) || price < 0) errors.push(`Variant "${size}": price must be >= 0.`);
      if (compareAtPrice !== null && compareAtPrice < price)
        errors.push(`Variant "${size}": MRP must be >= selling price.`);
      if (isNaN(stock) || stock < 0) errors.push(`Variant "${size}": stock must be >= 0.`);
      if (variantSizes.has(size)) errors.push(`Duplicate variant size: "${size}".`);
      if (variantIds.has(variantId)) errors.push(`Duplicate variant ID: "${variantId}".`);
      variantSizes.add(size);
      variantIds.add(variantId);

      return { variantId, size, price, compareAtPrice, stock, isActive: variantActive };
    });

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
    }

    await connectToDatabase();

    // Slug uniqueness check
    const existingSlug = await ProductModel.findOne({ slug });
    if (existingSlug) {
      return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
    }

    // Generate a stable productId
    const productId = `p-${nanoid(10)}`;
    const minPrice = Math.min(...mappedVariants.map((v: any) => v.price));

    const product = await ProductModel.create({
      productId,
      name,
      slug,
      category,
      description,
      images,
      badge,
      madeWith,
      isActive,
      variants: mappedVariants,
      price: minPrice,
      compareAtPrice: null,
    });

    return NextResponse.json({ product: product.toObject() }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
