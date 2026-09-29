import { NextResponse } from "next/server";
import { getDbNavigation } from "@/data/db-navigation";

/**
 * Navigation feed for the navbar: active categories, each with its active base
 * products. Never exposes an inactive category, product or variant.
 */
export async function GET() {
  try {
    const categories = await getDbNavigation();
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch navigation.";
    return NextResponse.json({ error: message, categories: [] }, { status: 500 });
  }
}
