import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { mapProductDocument } from "@/data/db-products";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { deleteProductVariantAssets, errorResponse, updateProduct } from "@/lib/product-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectToDatabase();
    const product = await ProductModel.findOne({
      $or: [{ productId: id }, { slug: id }],
    }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product: mapProductDocument(product, { includeInactiveVariants: true }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    const product = await updateProduct(id, await request.json());
    return NextResponse.json({ product: mapProductDocument(product, { includeInactiveVariants: true }) });
  } catch (error) {
    const response = errorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    const hardDelete = new URL(request.url).searchParams.get("hardDelete") === "true";
    await connectToDatabase();
    const product = await ProductModel.findOne({
      $or: [{ productId: id }, { slug: id }],
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const OrderModel = (await import("@/models/Order")).default;
    const orderCount = await OrderModel.countDocuments({ "items.productId": product.productId });
    if (hardDelete && orderCount === 0) {
      await ProductModel.deleteOne({ _id: product._id });
      await deleteProductVariantAssets(product.variants || []);
      return NextResponse.json({ hardDeleted: true, deactivated: false });
    }

    product.isActive = false;
    await product.save();
    return NextResponse.json({
      hardDeleted: false,
      deactivated: true,
      hasOrders: orderCount > 0,
      message: orderCount > 0
        ? "Product has historical orders and was deactivated instead of deleted."
        : "Product deactivated successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
