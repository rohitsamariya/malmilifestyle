import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { mapProductDocument } from "@/data/db-products";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { errorResponse, updateProduct } from "@/lib/product-service";
import {
  catalogAdminErrorResponse,
  deleteProducts,
  setProductsActive,
} from "@/lib/catalog-admin-service";

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

/**
 * Without `?hardDelete=true` the product is deactivated. With it, the product
 * is permanently removed — unless an order references it, in which case the
 * request is refused with 409 and the reason, so the admin can deactivate it
 * instead. Both paths run through `lib/catalog-admin-service`, the same
 * validated code the bulk endpoint uses.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const hardDelete = new URL(request.url).searchParams.get("hardDelete") === "true";

  try {
    const { id } = await params;

    if (!hardDelete) {
      const deactivated = await setProductsActive([id], false);
      const item = deactivated.items[0];
      if (item?.outcome === "not-found") {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }
      return NextResponse.json({
        hardDeleted: false,
        deleted: false,
        deactivated: true,
        result: deactivated,
        message: "Product deactivated successfully.",
      });
    }

    const result = await deleteProducts([id]);
    const item = result.items[0];

    if (item?.outcome === "not-found") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (item?.outcome === "blocked") {
      return NextResponse.json(
        {
          error: item.reason,
          hardDeleted: false,
          deleted: false,
          deactivated: false,
          blocked: true,
          result,
          message: item.reason,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({
      hardDeleted: true,
      deleted: true,
      deactivated: false,
      result,
      message: "Product permanently deleted.",
    });
  } catch (error) {
    const response = catalogAdminErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
