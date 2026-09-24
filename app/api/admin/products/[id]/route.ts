import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// GET /api/admin/products/[id] — admin-only, returns full doc including inactive variants
// ---------------------------------------------------------------------------
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectToDatabase();

    const doc = await ProductModel.findOne({
      $or: [{ productId: id }, { slug: id }],
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product: doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/products/[id] — admin-only, update product
// ---------------------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const ALLOWED_CATEGORIES = [
      "wood-pressed-oils",
      "wheat-atta",
      "multigrain-atta",
      "millet-atta",
    ];
    const ALLOWED_MADE_WITH = ["Wood-Pressed", "Stone-Ground"];

    const errors: string[] = [];

    // Build update object — only include defined fields
    const update: Record<string, any> = {};

    if (body.name !== undefined) {
      const name = (body.name ?? "").trim();
      if (!name) errors.push("Product name cannot be empty.");
      else update.name = name;
    }
    if (body.slug !== undefined) {
      const slug = (body.slug ?? "").trim();
      if (!slug) errors.push("Slug cannot be empty.");
      else update.slug = slug;
    }
    if (body.category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(body.category))
        errors.push("Invalid category.");
      else update.category = body.category;
    }
    if (body.description !== undefined) {
      const desc = (body.description ?? "").trim();
      if (!desc) errors.push("Description cannot be empty.");
      else update.description = desc;
    }
    if (body.images !== undefined) {
      update.images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    }
    if (body.badge !== undefined) {
      update.badge = (body.badge ?? "").trim() || null;
    }
    if (body.madeWith !== undefined) {
      if (!ALLOWED_MADE_WITH.includes(body.madeWith))
        errors.push("Invalid madeWith value.");
      else update.madeWith = body.madeWith;
    }
    if (body.isActive !== undefined) {
      update.isActive = Boolean(body.isActive);
    }

    // Variant handling
    if (body.variants !== undefined) {
      const variants = Array.isArray(body.variants) ? body.variants : [];
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

      // Derive the base product price from the minimum variant price
      const activePrices = mappedVariants
        .filter((v: any) => v.isActive)
        .map((v: any) => v.price);
      if (activePrices.length > 0) {
        update.price = Math.min(...activePrices);
      }
      update.variants = mappedVariants;
    }

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
    }

    await connectToDatabase();

    // Check for slug uniqueness if slug is being changed
    if (update.slug) {
      const existing = await ProductModel.findOne({
        slug: update.slug,
        productId: { $ne: id },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug is already in use by another product." }, { status: 409 });
      }
    }

    const doc = await ProductModel.findOneAndUpdate(
      { productId: id },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product: doc });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/[id] — admin-only, deactivate or delete product
// ---------------------------------------------------------------------------
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hardDelete") === "true";

    await connectToDatabase();

    const doc = await ProductModel.findOne({ productId: id });
    if (!doc) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Check order references (import Order model dynamically to avoid circular issues)
    const OrderModel = (await import("@/models/Order")).default;
    const orderCount = await OrderModel.countDocuments({
      "items.productId": id,
    });

    if (hardDelete) {
      if (orderCount > 0) {
        // Cannot hard-delete — has historical orders; deactivate instead
        doc.isActive = false;
        await doc.save();
        return NextResponse.json({
          message: `Product has ${orderCount} historical order(s). It has been deactivated instead of deleted.`,
          deactivated: true,
          hardDeleted: false,
        });
      }
      // Safe to hard-delete
      await ProductModel.deleteOne({ productId: id });
      return NextResponse.json({
        message: "Product permanently deleted.",
        hardDeleted: true,
        deactivated: false,
      });
    }

    // Default: soft-delete (deactivate)
    doc.isActive = false;
    await doc.save();
    return NextResponse.json({
      message: "Product deactivated successfully.",
      deactivated: true,
      hardDeleted: false,
      hasOrders: orderCount > 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
