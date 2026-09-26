/**
 * Customer session primitives.
 *
 * Deliberately dependency-free (no database, no `next/*` imports) so that
 * `proxy.ts` can perform optimistic cookie checks without pulling Mongoose
 * into the proxy bundle. Database-backed verification lives in
 * `lib/customerAuth.ts`.
 *
 * Customer sessions are completely separate from admin sessions:
 *   - different cookie name
 *   - different token shape (`c1.<id>.<issuedAt>.<signature>` vs `<email>:<ts>:<sig>`)
 *   - different HMAC domain-separation prefix
 * A customer token can therefore never be replayed as an admin token, and an
 * admin token can never be replayed as a customer session.
 */

export const CUSTOMER_SESSION_COOKIE = "malmi_customer_session";
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const TOKEN_VERSION = "c1";
const CUSTOMER_ID_PATTERN = /^[a-f0-9]{24}$/;
const SIGNATURE_PREFIX = "malmi-customer-session.v1:";

/** Cookie attributes shared by session creation and clearing. */
export const CUSTOMER_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
} as const;

export interface CustomerSession {
  customerId: string;
  issuedAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

async function hmacHex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

/** Signs a customer session token. Never throws on bad input — throws only when the secret is missing. */
export async function createCustomerSessionToken(
  customerId: string,
  issuedAt: number = Date.now(),
): Promise<string> {
  if (!CUSTOMER_ID_PATTERN.test(customerId)) {
    throw new Error("A valid customer id is required to create a session.");
  }
  const payload = `${TOKEN_VERSION}.${customerId}.${issuedAt}`;
  const signature = await hmacHex(`${SIGNATURE_PREFIX}${payload}`);
  return `${payload}.${signature}`;
}

/**
 * Verifies a customer session token.
 * Returns null for any malformed, tampered, expired or foreign token.
 */
export async function verifyCustomerSessionToken(
  token: string | undefined,
  now: number = Date.now(),
): Promise<CustomerSession | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, customerId, issuedAtRaw, signature] = parts;
  if (version !== TOKEN_VERSION) return null;
  if (!CUSTOMER_ID_PATTERN.test(customerId)) return null;
  if (!/^\d{10,20}$/.test(issuedAtRaw)) return null;

  const issuedAt = Number(issuedAtRaw);
  if (issuedAt > now + 60_000) return null; // token issued in the future
  if (now - issuedAt > CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000) return null;

  let expected: string;
  try {
    expected = await hmacHex(`${SIGNATURE_PREFIX}${version}.${customerId}.${issuedAtRaw}`);
  } catch {
    return null;
  }
  if (!safeEquals(signature, expected)) return null;

  return { customerId, issuedAt };
}

/** Reads the customer session token out of a raw `Cookie` request header. */
export function readSessionTokenFromCookieHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== CUSTOMER_SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : undefined;
  }
  return undefined;
}

/** Reads the customer session token out of a standard `Request`. */
export function readSessionTokenFromRequest(request: Request): string | undefined {
  return readSessionTokenFromCookieHeader(request.headers.get("cookie"));
}
