import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CategoryModel from "@/models/Category";
import ProductModel from "@/models/Product";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { parseCategoryInput } from "@/lib/catalog-validation";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
    await connectToDatabase();
    const filter = includeInactive ? {} : { isActive: true };
    const categories = await CategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    const counts = await ProductModel.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { $ifNull: ["$categorySlug", "$category"] },
          count: { $sum: 1 },
        },
      },
    ]);
    const countBySlug = new Map(counts.map((entry) => [entry._id, entry.count]));
    return NextResponse.json({
      categories: categories.map((category) => ({
        ...category,
        productCount: countBySlug.get(category.slug) ?? 0,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories.";
    return NextResponse.json({ error: message, categories: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = parseCategoryInput(body);
    if (parsed.errors.length) {
      return NextResponse.json({ error: parsed.errors.join(" "), errors: parsed.errors }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await CategoryModel.findOne({
      $or: [{ slug: parsed.slug }, { name: parsed.name }],
    }).lean();
    if (existing) {
      return NextResponse.json({ error: "A category with this slug or name already exists." }, { status: 409 });
    }

    const category = await CategoryModel.create({
      categoryId: `cat-${parsed.slug}`,
      name: parsed.name,
      slug: parsed.slug,
      shortName: parsed.shortName,
      description: parsed.description,
      image: parsed.image,
      imagePublicId: parsed.imagePublicId,
      isActive: parsed.isActive,
      sortOrder: parsed.sortOrder,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
