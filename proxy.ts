import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "./lib/adminAuth";

const customerPrefixes = [
  "/products",
  "/profile",
  "/cart",
  "/checkout",
  "/account",
  "/wishlist",
];

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isCustomerPath(pathname: string): boolean {
  return pathname === "/" || customerPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get(ADMIN_COOKIE_NAME);
  const isAuthenticated = await verifyAdminToken(tokenCookie?.value);

  if (isAdminPath(pathname)) {
    if (pathname === "/admin/login") {
      if (isAuthenticated) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!isAuthenticated) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  if (isCustomerPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/products/:path*",
    "/profile/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/account/:path*",
    "/wishlist/:path*",
  ],
};
