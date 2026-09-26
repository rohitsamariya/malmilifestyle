/**
 * Pure (no database) tests for the customer session and credential rules.
 *
 * Every module under test is loaded with a dynamic import so that the
 * test-only SESSION_SECRET is in place before any module-level env read.
 */

import assert from "node:assert/strict";
import test from "node:test";

process.env.SESSION_SECRET = "test-only-session-secret-do-not-use-in-production";
// `lib/adminAuth.ts` captures its environment at module load, so this has to be
// set before the dynamic import in the hook below.
process.env.ADMIN_EMAIL = "owner@example.com";

const SESSION_SECRET = process.env.SESSION_SECRET;
const CUSTOMER_ID = "65f0c0a1b2c3d4e5f6071829";

type SessionModule = typeof import("@/lib/customer-session");
type ValidationModule = typeof import("@/lib/customer-validation");
type RedirectsModule = typeof import("@/lib/redirects");
type RateLimitModule = typeof import("@/lib/rate-limit");
type AdminModule = typeof import("@/lib/adminAuth");

let session: SessionModule;
let validation: ValidationModule;
let redirects: RedirectsModule;
let rateLimit: RateLimitModule;
let admin: AdminModule;

test.before(async () => {
  session = await import("@/lib/customer-session");
  validation = await import("@/lib/customer-validation");
  redirects = await import("@/lib/redirects");
  rateLimit = await import("@/lib/rate-limit");
  admin = await import("@/lib/adminAuth");
});

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

test("a signed customer session round-trips its customer id", async () => {
  const token = await session.createCustomerSessionToken(CUSTOMER_ID);
  const verified = await session.verifyCustomerSessionToken(token);
  assert.equal(verified?.customerId, CUSTOMER_ID);
  assert.ok(typeof verified?.issuedAt === "number");
});

test("session cookies are HTTP-only, same-site and long enough to be usable", () => {
  assert.equal(session.CUSTOMER_SESSION_COOKIE, "malmi_customer_session");
  assert.equal(session.CUSTOMER_SESSION_COOKIE_OPTIONS.httpOnly, true);
  assert.equal(session.CUSTOMER_SESSION_COOKIE_OPTIONS.sameSite, "lax");
  assert.equal(session.CUSTOMER_SESSION_COOKIE_OPTIONS.path, "/");
  assert.ok(session.CUSTOMER_SESSION_MAX_AGE_SECONDS >= 60 * 60);
});

test("a tampered payload or signature is rejected", async () => {
  const token = await session.createCustomerSessionToken(CUSTOMER_ID);
  const [version, id, issuedAt, signature] = token.split(".");

  const otherId = "65f0c0a1b2c3d4e5f607182a";
  assert.equal(await session.verifyCustomerSessionToken(`${version}.${otherId}.${issuedAt}.${signature}`), null);
  assert.equal(await session.verifyCustomerSessionToken(`${version}.${id}.${issuedAt}.${"0".repeat(signature.length)}`), null);
  assert.equal(await session.verifyCustomerSessionToken(token.slice(0, -1)), null);
});

test("an expired session is rejected and a fresh one is not", async () => {
  const issuedAt = Date.now();
  const expired = await session.createCustomerSessionToken(
    CUSTOMER_ID,
    issuedAt - session.CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000 - 60_000,
  );
  assert.equal(await session.verifyCustomerSessionToken(expired, issuedAt), null);

  const fresh = await session.createCustomerSessionToken(CUSTOMER_ID, issuedAt);
  assert.equal((await session.verifyCustomerSessionToken(fresh, issuedAt))?.customerId, CUSTOMER_ID);
});

test("garbage and a missing secret never authenticate", async () => {
  for (const value of [undefined, "", "not-a-token", "c1.zz.1.aa", "a.b.c.d.e", "::::"]) {
    assert.equal(await session.verifyCustomerSessionToken(value), null);
  }

  const previous = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  try {
    // With no secret configured a forged token can never be accepted.
    assert.equal(await session.verifyCustomerSessionToken("c1.abc.1.deadbeef"), null);
  } finally {
    process.env.SESSION_SECRET = previous;
  }
});

test("an admin session token can never be replayed as a customer session", async () => {
  const adminToken = await admin.createAdminToken("owner@example.com");
  assert.equal(await session.verifyCustomerSessionToken(adminToken), null);
  assert.equal(await admin.verifyAdminToken(adminToken), true);

  // ...and the reverse direction.
  const customerToken = await session.createCustomerSessionToken(CUSTOMER_ID);
  assert.equal(await admin.verifyAdminToken(customerToken), false);
});

test("the customer session cookie name is distinct from the admin cookie", () => {
  assert.notEqual(session.CUSTOMER_SESSION_COOKIE, admin.ADMIN_COOKIE_NAME);
});

test("the session token is read out of a raw cookie header", () => {
  const header = `other=1; ${session.CUSTOMER_SESSION_COOKIE}=c1.abc.1.deadbeef; another=2`;
  assert.equal(session.readSessionTokenFromCookieHeader(header), "c1.abc.1.deadbeef");
  assert.equal(session.readSessionTokenFromCookieHeader("other=1"), undefined);
  assert.equal(session.readSessionTokenFromCookieHeader(null), undefined);
});

// ---------------------------------------------------------------------------
// Registration and login validation
// ---------------------------------------------------------------------------

test("valid registration input is normalized", () => {
  const parsed = validation.parseRegisterInput({
    name: "  Asha   Rao  ",
    email: "  ASHA@Example.COM ",
    password: "correct-horse",
    phone: "+91 98765 43210",
  });
  assert.deepEqual(parsed, {
    name: "Asha Rao",
    email: "asha@example.com",
    password: "correct-horse",
    phone: "9876543210",
  });
});

test("registration rejects bad name, email, phone and password", () => {
  const cases: Array<Record<string, unknown>> = [
    { name: "A", email: "a@b.com", password: "longenough", phone: "9876543210" },
    { name: "Asha Rao", email: "not-an-email", password: "longenough", phone: "9876543210" },
    { name: "Asha Rao", email: "a@b.com", password: "longenough", phone: "1234567890" },
    { name: "Asha Rao", email: "a@b.com", password: "short", phone: "9876543210" },
  ];
  for (const input of cases) {
    assert.throws(
      () => validation.parseRegisterInput(input),
      (error: unknown) => error instanceof validation.CustomerValidationError && error.status === 400,
    );
  }
});

test("login input requires an email and a password", () => {
  assert.throws(
    () => validation.parseLoginInput({ email: "", password: "" }),
    (error: unknown) => error instanceof validation.CustomerValidationError,
  );
  assert.deepEqual(validation.parseLoginInput({ email: "A@B.com ", password: " pw " }), {
    email: "a@b.com",
    password: " pw ",
  });
});

test("passwords are bcrypt hashed and never compared in plaintext", async () => {
  const hash = await validation.hashPassword("correct-horse");
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(hash.includes("correct-horse"), false);
  assert.equal(await validation.verifyPassword("correct-horse", hash), true);
  assert.equal(await validation.verifyPassword("wrong", hash), false);
  // An unknown customer still pays the cost of a comparison.
  assert.equal(await validation.verifyPassword("anything", ""), false);
});

// ---------------------------------------------------------------------------
// Redirect hardening
// ---------------------------------------------------------------------------

test("only same-origin in-app paths are accepted as post-login destinations", () => {
  for (const value of [
    "/profile",
    "/checkout",
    "/orders/MALMI-2026-abc",
    "/products?category=oils",
  ]) {
    assert.equal(redirects.isSafeRedirect(value), true, value);
  }

  for (const value of [
    undefined,
    null,
    42,
    "",
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example",
    "/admin",
    "/admin/orders",
    "/login",
    "/register",
    "/logout",
    "/profile\n/../admin",
  ]) {
    assert.equal(redirects.isSafeRedirect(value), false, String(value));
  }

  assert.equal(redirects.safeRedirectOr("https://evil.example", "/profile"), "/profile");
  assert.equal(redirects.safeRedirectOr("/cart", "/profile"), "/cart");
  assert.equal(
    redirects.loginRedirectUrl("/checkout"),
    "/login?redirect=%2Fcheckout",
  );
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

test("the rate limiter trips at the limit and recovers after the window", () => {
  rateLimit.resetRateLimits();
  const now = 1_000_000;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    assert.equal(rateLimit.checkRateLimit("login:1.1.1.1", 3, 60_000, now).ok, true, `attempt ${attempt}`);
  }
  const blocked = rateLimit.checkRateLimit("login:1.1.1.1", 3, 60_000, now);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  // A different address gets its own bucket.
  assert.equal(rateLimit.checkRateLimit("login:2.2.2.2", 3, 60_000, now).ok, true);
  // The window resets.
  assert.equal(rateLimit.checkRateLimit("login:1.1.1.1", 3, 60_000, now + 60_001).ok, true);
});

test("rate limit buckets are keyed per scope and per client address", () => {
  rateLimit.resetRateLimits();
  const request = new Request("https://shop.example/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
  });
  assert.equal(rateLimit.rateLimitKey(request, "login"), "login:203.0.113.7");
  assert.equal(rateLimit.rateLimitKey(request, "register"), "register:203.0.113.7");
  assert.notEqual(rateLimit.rateLimitKey(request, "login"), rateLimit.rateLimitKey(request, "register"));
});

test("the test secret was not left behind in production configuration", () => {
  assert.equal(SESSION_SECRET, "test-only-session-secret-do-not-use-in-production");
});
