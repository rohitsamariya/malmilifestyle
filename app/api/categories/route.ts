import { NextResponse } from "next/server";
import { getDbCategories } from "@/data/db-categories";

export async function GET() {
  try {
    const categories = await getDbCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories.";
    return NextResponse.json({ error: message, categories: [] }, { status: 500 });
  }
}
