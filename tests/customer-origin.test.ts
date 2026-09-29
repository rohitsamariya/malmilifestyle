/**
 * Trusted-origin (CSRF) validation.
 *
 * These cover the production regression where every browser submission was
 * rejected with `403 Invalid request origin.` because the check compared
 * `Origin` against `request.url`, which behind Render's reverse proxy does not
 * describe the public origin.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  configuredOrigins,
  isSameOriginRequest,
  isTrustedOrigin,
  LOCAL_DEVELOPMENT_ORIGINS,
  normalizeHost,
  normalizeOrigin,
  trustedOrigins,
} from "@/lib/customer-origin";

const PRODUCTION_ORIGIN = "https://malmilifestyle.onrender.com";
const PRODUCTION_HOST = "malmilifestyle.onrender.com";

/** Mirrors a browser POST behind Render's TLS-terminating proxy. */
function proxiedRequest(origin: string | null, host: string | null = PRODUCTION_HOST): Request {
  const headers = new Headers({ "x-forwarded-proto": "https" });
  if (origin !== null) headers.set("origin", origin);
  if (host !== null) headers.set("host", host);
  return new Request(`https://${PRODUCTION_HOST}/api/auth/register`, { method: "POST", headers });
}

const productionEnv = { NODE_ENV: "production", APP_URL: PRODUCTION_ORIGIN } as NodeJS.ProcessEnv;
const productionEnvNoAppUrl = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
const developmentEnv = { NODE_ENV: "development", APP_URL: PRODUCTION_ORIGIN } as NodeJS.ProcessEnv;

// --- Normalisation -------------------------------------------------------

test("normalizeOrigin keeps the scheme and strips default ports", () => {
  assert.equal(normalizeOrigin("https://malmilifestyle.onrender.com"), PRODUCTION_ORIGIN);
  assert.equal(normalizeOrigin("https://example.com:443"), "https://example.com");
  assert.equal(normalizeOrigin("http://example.com:80"), "http://example.com");
  assert.equal(normalizeOrigin("HTTPS://MalmiLifestyle.OnRender.COM/"), "https://malmilifestyle.onrender.com");
});

test("normalizeOrigin rejects the opaque origin and other non-URLs", () => {
  assert.equal(normalizeOrigin("null"), null);
  assert.equal(normalizeOrigin(""), null);
  assert.equal(normalizeOrigin("   "), null);
  assert.equal(normalizeOrigin("not-a-url"), null);
  assert.equal(normalizeOrigin(undefined), null);
});

test("normalizeHost tolerates bare hosts and strips paths", () => {
  assert.equal(normalizeHost("malmilifestyle.onrender.com"), PRODUCTION_HOST);
  assert.equal(normalizeHost("MalmiLifestyle.OnRender.com"), PRODUCTION_HOST);
  assert.equal(normalizeHost("https://malmilifestyle.onrender.com/some/path"), PRODUCTION_HOST);
  assert.equal(normalizeHost("localhost:3000"), "localhost:3000");
  assert.equal(normalizeHost(""), null);
});

// --- Configuration -------------------------------------------------------

test("APP_URL is the single source of configured origins", () => {
  assert.deepEqual(configuredOrigins(productionEnv), [PRODUCTION_ORIGIN]);
  assert.deepEqual(configuredOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv), []);
});

test("APP_URL accepts a comma separated list and ignores unusable entries", () => {
  const env = { NODE_ENV: "production", APP_URL: `${PRODUCTION_ORIGIN}, not-a-url ,https://alt.example.com` };
  assert.deepEqual(configuredOrigins(env as NodeJS.ProcessEnv), [PRODUCTION_ORIGIN, "https://alt.example.com"]);
});

test("local development origins are never trusted in production", () => {
  for (const origin of LOCAL_DEVELOPMENT_ORIGINS) {
    assert.ok(trustedOrigins(developmentEnv as NodeJS.ProcessEnv).includes(origin), `${origin} in dev`);
    assert.ok(!trustedOrigins(productionEnv as NodeJS.ProcessEnv).includes(origin), `${origin} not in prod`);
  }
});

// --- The cases named in the brief ---------------------------------------

test("1. the deployed production origin is allowed", () => {
  assert.equal(isTrustedOrigin({ origin: PRODUCTION_ORIGIN, host: PRODUCTION_HOST, env: productionEnv }), true);
  assert.equal(isSameOriginRequest(proxiedRequest(PRODUCTION_ORIGIN), productionEnv), true);
});

test("2. the local development origin is allowed", () => {
  for (const origin of LOCAL_DEVELOPMENT_ORIGINS) {
    assert.equal(isTrustedOrigin({ origin, host: null, env: developmentEnv }), true, origin);
  }
  assert.equal(
    isSameOriginRequest(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      }),
      developmentEnv,
    ),
    true,
  );
});

test("3. a foreign origin is rejected", () => {
  assert.equal(isTrustedOrigin({ origin: "https://evil.example.com", host: PRODUCTION_HOST, env: productionEnv }), false);
  assert.equal(isSameOriginRequest(proxiedRequest("https://evil.example.com"), productionEnv), false);
});

test("4. a look-alike origin is rejected", () => {
  for (const origin of [
    "https://malmilifestyle.fake",
    "https://malmilifestyle.onrender.com.evil.example",
    "https://notmalmilifestyle.onrender.com",
  ]) {
    assert.equal(isTrustedOrigin({ origin, host: PRODUCTION_HOST, env: productionEnv }), false, origin);
  }
});

test("5. a missing Origin header keeps the server-to-server behaviour", () => {
  for (const origin of [null, undefined, ""]) {
    assert.equal(isTrustedOrigin({ origin, host: PRODUCTION_HOST, env: productionEnv }), true, String(origin));
  }
  assert.equal(isSameOriginRequest(proxiedRequest(null), productionEnv), true);
});

test("the opaque origin 'null' is always rejected", () => {
  assert.equal(isTrustedOrigin({ origin: "null", host: PRODUCTION_HOST, env: productionEnv }), false);
});

test("no wildcard behaviour: unrelated hosts are refused even with no APP_URL", () => {
  assert.equal(
    isTrustedOrigin({ origin: "https://evil.example.com", host: PRODUCTION_HOST, env: productionEnvNoAppUrl }),
    false,
  );
});

// --- Reverse-proxy behaviour --------------------------------------------

test("the same-origin fallback works without APP_URL, matching Next's own check", () => {
  assert.equal(
    isTrustedOrigin({ origin: PRODUCTION_ORIGIN, host: PRODUCTION_HOST, env: productionEnvNoAppUrl }),
    true,
  );
});

test("the same-origin fallback compares hosts, not schemes", () => {
  // Render terminates TLS and may report an internal scheme upstream.
  assert.equal(
    isTrustedOrigin({ origin: "https://malmilifestyle.onrender.com", host: "http://0.0.0.0:10000", env: productionEnvNoAppUrl }),
    false,
  );
});

test("x-forwarded-host is used when host is absent", () => {
  const request = new Request("https://internal/api/auth/register", {
    method: "POST",
    headers: { origin: PRODUCTION_ORIGIN, "x-forwarded-host": PRODUCTION_HOST },
  });
  assert.equal(isSameOriginRequest(request, productionEnvNoAppUrl), true);
});

test("a request with no host and no configured origin is rejected", () => {
  assert.equal(
    isTrustedOrigin({ origin: PRODUCTION_ORIGIN, host: null, env: productionEnvNoAppUrl }),
    false,
  );
});

// --- One implementation across every state-changing route ---------------

test("register, login, logout and order creation share the same decision", () => {
  const routes = ["/api/auth/register", "/api/auth/login", "/api/auth/logout", "/api/orders"];
  // [label, origin, expected in development, expected in production]
  const scenarios: Array<[string, string | null, boolean, boolean]> = [
    ["production", PRODUCTION_ORIGIN, true, true],
    ["localhost", "http://localhost:3000", true, false],
    ["foreign", "https://evil.example.com", false, false],
    ["look-alike", "https://malmilifestyle.fake", false, false],
    ["opaque", "null", false, false],
    ["missing", null, true, true],
  ];

  for (const route of routes) {
    for (const [label, origin, expectedInDev, expectedInProd] of scenarios) {
      const request = () =>
        new Request(`https://${PRODUCTION_HOST}${route}`, {
          method: "POST",
          headers: {
            ...(origin === null ? {} : { origin }),
            host: PRODUCTION_HOST,
          },
        });

      assert.equal(
        isSameOriginRequest(request(), developmentEnv),
        expectedInDev,
        `${route} (dev) should ${expectedInDev ? "allow" : "reject"} ${label}`,
      );
      assert.equal(
        isSameOriginRequest(request(), productionEnv),
        expectedInProd,
        `${route} (prod) should ${expectedInProd ? "allow" : "reject"} ${label}`,
      );
    }
  }
});
