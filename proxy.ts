import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "./lib/adminAuth";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionToken } from "./lib/customer-session";
import { isSafeRedirect, safeRedirectOr } from "./lib/redirects";

const customerPrefixes = [
  "/products",
  "/profile",
  "/cart",
  "/checkout",
  "/account",
  "/wishlist",
  "/orders",
  "/login",
  "/register",
];

/** Pages that require a customer session. The storefront, cart and product pages stay public. */
const protectedCustomerPrefixes = ["/profile", "/checkout", "/orders"];

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isCustomerPath(pathname: string): boolean {
  return pathname === "/" || customerPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedCustomerPath(pathname: string): boolean {
  return protectedCustomerPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
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

  // --- Customer session routing -------------------------------------------
  // Optimistic only: the cookie signature is checked here, but the page and the
  // API re-verify against MongoDB before trusting the identity.
  const customerToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const hasCustomerSession = (await verifyCustomerSessionToken(customerToken)) !== null;

  if (isAuthPage(pathname)) {
    if (hasCustomerSession) {
      const requested = safeRedirectOr(request.nextUrl.searchParams.get("redirect"), "/profile");
      return NextResponse.redirect(new URL(requested, request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedCustomerPath(pathname) && !hasCustomerSession) {
    const returnTo = isSafeRedirect(pathname) ? pathname : "/profile";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${returnTo}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
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
    "/orders/:path*",
    "/login",
    "/register",
    "/account/:path*",
    "/wishlist/:path*",
  ],
};
