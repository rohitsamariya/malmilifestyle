import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  authenticateAdminRequest,
  createAdminToken,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const isValid = await authenticateAdminRequest(email, password);
    if (!isValid) {
      // Do not reveal whether email exists
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createAdminToken(email);
    const response = NextResponse.json({ success: true, redirect: "/admin" });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
