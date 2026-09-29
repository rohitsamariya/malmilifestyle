/**
 * Trusted-origin (CSRF) validation for the state-changing customer endpoints.
 *
 * ## Why the previous check broke in production
 *
 * The original implementation compared the `Origin` header against
 * `new URL(request.url).host`. Behind a reverse proxy — Render terminates TLS
 * and forwards the request to the Node process — `request.url` can describe the
 * *internal* address the app received rather than the public origin the browser
 * used. That made the site's own legitimate requests fail the comparison, so
 * every browser submission was rejected with `403 Invalid request origin.`
 * even when the origin was the real deployment.
 *
 * ## The approach used here
 *
 * Next.js applies the same defence to Server Actions: it compares the `Origin`
 * header with the `Host` (or `X-Forwarded-Host`) header, and its documentation
 * recommends an explicit allowlist when a reverse proxy is in front of the app.
 * We do both:
 *
 *  1. An explicit allowlist from the single canonical `APP_URL` environment
 *     variable (comma separated). This is the authoritative production value.
 *  2. The local development origins, and only outside production.
 *  3. A same-origin fallback that compares the `Origin` host with the host the
 *     request was actually addressed to. This keeps a correctly proxied
 *     deployment working even before `APP_URL` is configured.
 *
 * The check is deliberately strict: a missing `Origin` stays allowed (trusted
 * server-to-server callers cannot be CSRF'd), the literal origin `null` is
 * always rejected, and no value is treated as a wildcard.
 */

/** Origins allowed while developing locally. Never trusted in production. */
export const LOCAL_DEVELOPMENT_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/**
 * Parses an absolute http(s) URL that actually carries a host. Returns `null`
 * for anything else, which also rejects the literal origin `null` that browsers
 * send for opaque contexts such as sandboxed iframes and `data:` documents.
 *
 * Requiring a real http(s) host matters: `new URL("localhost:3000")` otherwise
 * parses happily as the scheme `localhost:` with an *empty* host.
 */
function parseAbsoluteUrl(value: string | null | undefined): URL | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.host) return null;
  return url;
}

/** Normalizes an absolute origin to `scheme://host[:port]`, or `null`. */
export function normalizeOrigin(value: string | null | undefined): string | null {
  return parseAbsoluteUrl(value)?.origin ?? null;
}

/** Extracts a comparable lower-cased host, tolerating a bare `host[:port]`. */
export function normalizeHost(value: string | null | undefined): string | null {
  const absolute = parseAbsoluteUrl(value);
  if (absolute) return absolute.host.toLowerCase();
  if (typeof value !== "string") return null;
  const bare = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();
  return bare || null;
}

/**
 * Origins declared through configuration. `APP_URL` is the only variable read
 * here so there is a single canonical answer to "what is this deployment's URL".
 */
export function configuredOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.APP_URL;
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((entry) => normalizeOrigin(entry))
    .filter((origin): origin is string => origin !== null);
}

/** Local origins, suppressed in production so dev assumptions cannot leak. */
export function localDevelopmentOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return env.NODE_ENV === "production" ? [] : [...LOCAL_DEVELOPMENT_ORIGINS];
}

/** Every origin this deployment accepts as its own, in match order. */
export function trustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return [...new Set([...configuredOrigins(env), ...localDevelopmentOrigins(env)])];
}

export interface TrustedOriginInput {
  /** The raw `Origin` request header, or `null` when the client sent none. */
  origin: string | null | undefined;
  /** The host the request was addressed to, used for the same-origin fallback. */
  host?: string | null;
  /** Overridable for tests; defaults to the process environment. */
  env?: NodeJS.ProcessEnv;
}

/**
 * Decides whether a state-changing request may proceed.
 *
 * Returns `true` when:
 *  - the client sent no `Origin` (server-to-server; unchanged behaviour), or
 *  - the origin is explicitly configured / a local development origin, or
 *  - the origin host matches the host the request was addressed to.
 *
 * Everything else — foreign origins, opaque `null`, malformed values — is
 * rejected so the caller can answer `403 Invalid request origin.`
 */
export function isTrustedOrigin({ origin, host = null, env = process.env }: TrustedOriginInput): boolean {
  // No Origin header means this is not a browser-initiated cross-site request.
  // Preserved so trusted server-to-server callers keep working.
  if (origin === null || origin === undefined || origin.trim() === "") return true;

  const normalized = normalizeOrigin(origin);
  if (normalized === null) return false;

  if (trustedOrigins(env).includes(normalized)) return true;

  // Same-origin fallback. Compared on host only, because a terminating proxy
  // may report a different internal scheme than the browser used.
  const requestHost = normalizeHost(host);
  return requestHost !== null && normalizeHost(normalized) === requestHost;
}

/** Reads the headers a `Request` needs to apply the check. */
export function isSameOriginRequest(request: Request, env: NodeJS.ProcessEnv = process.env): boolean {
  return isTrustedOrigin({
    origin: request.headers.get("origin"),
    host: request.headers.get("host") ?? request.headers.get("x-forwarded-host"),
    env,
  });
}
