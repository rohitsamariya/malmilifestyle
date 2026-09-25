import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { parseCategoryInput } from "@/lib/catalog-validation";

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
    const category = await CategoryModel.findOne(categoryFilter(id));
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const productCount = await ProductModel.countDocuments({
      $or: [{ categoryId: category.categoryId }, { categorySlug: category.slug }, { category: category.slug }],
    });
    if (hardDelete && productCount === 0) {
      await CategoryModel.deleteOne({ _id: category._id });
      return NextResponse.json({ hardDeleted: true, deactivated: false });
    }

    category.isActive = false;
    await category.save();
    return NextResponse.json({
      hardDeleted: false,
      deactivated: true,
      productCount,
      message: productCount > 0
        ? "Category has products and was deactivated instead of deleted."
        : "Category deactivated successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
