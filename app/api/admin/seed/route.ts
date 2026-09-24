import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminAuth";
import { seedProducts } from "@/scripts/seedDatabase";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const isAuthenticated = await verifyAdminToken(token);

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin authentication required." },
        { status: 401 }
      );
    }

    const stats = await seedProducts();
    return NextResponse.json({
      success: true,
      message: "Database seed completed successfully.",
      stats,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json(
      { error: `Database seed failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
