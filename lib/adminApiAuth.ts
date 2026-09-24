import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

/**
 * Verifies the admin session cookie for API route handlers.
 * Returns null if authenticated, or a 401 NextResponse if not.
 */
export async function requireAdminSession(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
