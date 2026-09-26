/**
 * Post-auth redirect hardening. Dependency-free so `proxy.ts` can use it
 * without pulling bcrypt or Mongoose into the proxy bundle.
 */

/**
 * Only same-origin, in-app paths may be used as a post-login destination.
 * Blocks protocol-relative URLs (`//evil.com`), absolute URLs, backslash
 * smuggling, control characters, and any attempt to land inside the admin area
 * or bounce straight back to the auth pages.
 */
export function isSafeRedirect(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  const [pathname] = value.split(/[?#]/);
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  if (pathname === "/login" || pathname === "/register" || pathname === "/logout") return false;
  return true;
}

export function safeRedirectOr(value: unknown, fallback: string): string {
  return isSafeRedirect(value) ? value : fallback;
}

/** Builds the login URL that returns the customer to the page they requested. */
export function loginRedirectUrl(returnTo: string): string {
  const target = safeRedirectOr(returnTo, "/profile");
  return `/login?redirect=${encodeURIComponent(target)}`;
}

/** Builds the register URL that returns the customer to the page they requested. */
export function registerRedirectUrl(returnTo: string): string {
  const target = safeRedirectOr(returnTo, "/profile");
  return `/register?redirect=${encodeURIComponent(target)}`;
}
