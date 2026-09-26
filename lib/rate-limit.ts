/**
 * Minimal in-process rate limiter for the credential endpoints.
 *
 * Scope: this protects a single long-running Node process (self-hosted /
 * single-instance deployments). On multi-instance or serverless deployments
 * replace the store below with a shared one (Redis, Upstash, ...) — the call
 * sites do not need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_TRACKED_KEYS) pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

/** Derives a rate-limit bucket key from request headers. */
export function rateLimitKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const address = (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
  return `${scope}:${address || "unknown"}`;
}

/** Test helper — drops all tracked buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}
