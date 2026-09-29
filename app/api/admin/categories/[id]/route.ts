import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { parseCategoryInput } from "@/lib/catalog-validation";
import {
  catalogAdminErrorResponse,
  deleteCategories,
  setCategoriesActive,
} from "@/lib/catalog-admin-service";

function categoryFilter(id: string) {
  return { $or: [{ categoryId: id }, { slug: id }] };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectToDatabase();
    const category = await CategoryModel.findOne(categoryFilter(id)).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    const productCount = await ProductModel.countDocuments({
      $or: [{ categoryId: category.categoryId }, { categorySlug: category.slug }, { category: category.slug }],
    });
    return NextResponse.json({ category: { ...category, productCount } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch category.";
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
    await connectToDatabase();
    const existing = await CategoryModel.findOne(categoryFilter(id)).lean();
    if (!existing) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = parseCategoryInput({ ...existing, ...body });
    if (parsed.errors.length) {
      return NextResponse.json({ error: parsed.errors.join(" "), errors: parsed.errors }, { status: 400 });
    }

    const duplicate = await CategoryModel.findOne({
      _id: { $ne: existing._id },
      $or: [{ slug: parsed.slug }, { name: parsed.name }],
    }).lean();
    if (duplicate) {
      return NextResponse.json({ error: "A category with this slug or name already exists." }, { status: 409 });
    }

    const oldSlug = existing.slug;
    const category = await CategoryModel.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          name: parsed.name,
          slug: parsed.slug,
          shortName: parsed.shortName,
          description: parsed.description,
          image: parsed.image,
          imagePublicId: parsed.imagePublicId,
          isActive: parsed.isActive,
          sortOrder: parsed.sortOrder,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).lean();

    if (oldSlug !== parsed.slug) {
      await ProductModel.updateMany(
        { $or: [{ categoryId: existing.categoryId }, { categorySlug: oldSlug }, { category: oldSlug }] },
        { $set: { categoryId: existing.categoryId, categorySlug: parsed.slug, category: parsed.slug } },
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Without `?hardDelete=true` the category is deactivated. With it, the category
 * is permanently removed together with its products — unless any of those
 * products is referenced by a historical order, in which case the request is
 * refused with 409 and the reason. Both paths share the validated code in
 * `lib/catalog-admin-service` with the bulk endpoint.
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
      const deactivated = await setCategoriesActive([id], false);
      const item = deactivated.items[0];
      if (item?.outcome === "not-found") {
        return NextResponse.json({ error: "Category not found." }, { status: 404 });
      }
      return NextResponse.json({
        hardDeleted: false,
        deleted: false,
        deactivated: true,
        result: deactivated,
        message: "Category deactivated successfully.",
      });
    }

    const result = await deleteCategories([id]);
    const item = result.items[0];

    if (item?.outcome === "not-found") {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
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
      message: "Category permanently deleted.",
    });
  } catch (error) {
    const response = catalogAdminErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
