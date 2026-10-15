/**
 * Razorpay server-side primitives.
 *
 * Everything here is server-only: the key secret and webhook secret must never
 * reach the browser. Nothing is read from the environment at module load time —
 * the getters below throw only when actually called at runtime, so unrelated
 * build-time static analysis never requires the credentials to be present.
 *
 * The webhook signature is an HMAC-SHA256 (hex) of the *raw* request body,
 * keyed with the webhook secret, sent in the `X-Razorpay-Signature` header.
 * https://razorpay.com/docs/webhooks/validate-test
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const RAZORPAY_SIGNATURE_HEADER = "x-razorpay-signature";
export const RAZORPAY_EVENT_ID_HEADER = "x-razorpay-event-id";

function requiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is not configured.`);
  }
  return value.trim();
}

/** Public key id (safe for a future client checkout). Runtime-validated. */
export function getRazorpayKeyId(env: NodeJS.ProcessEnv = process.env): string {
  return requiredEnv("RAZORPAY_KEY_ID", env);
}

/** Server-only key secret, used for authorized API calls. Runtime-validated. */
export function getRazorpayKeySecret(env: NodeJS.ProcessEnv = process.env): string {
  return requiredEnv("RAZORPAY_KEY_SECRET", env);
}

/** Server-only webhook signing secret. Runtime-validated. */
export function getRazorpayWebhookSecret(env: NodeJS.ProcessEnv = process.env): string {
  return requiredEnv("RAZORPAY_WEBHOOK_SECRET", env);
}

/**
 * Constant-time verification of a Razorpay webhook signature.
 *
 * Returns false for anything that is not an exact match — a missing signature,
 * a wrong secret, a tampered body, a non-hex value, or a length mismatch — and
 * never leaks which part failed through timing.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  return verifyHexHmac(rawBody, signature, secret);
}

/**
 * Constant-time verification of a Razorpay Checkout handoff signature.
 *
 * After the browser completes a payment, Razorpay Checkout returns the gateway
 * order id, the payment id and a signature. That signature is an HMAC-SHA256
 * (hex) of `"<order_id>|<payment_id>"` keyed with the *key secret* — a different
 * secret from the webhook's. Verifying it here proves the returning browser
 * actually completed a payment for the order it claims.
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/#step-3
 */
export function verifyRazorpayCheckoutSignature(
  input: { orderId: string; paymentId: string; signature: string | null | undefined },
  secret: string,
): boolean {
  if (typeof input.orderId !== "string" || !input.orderId) return false;
  if (typeof input.paymentId !== "string" || !input.paymentId) return false;
  return verifyHexHmac(`${input.orderId}|${input.paymentId}`, input.signature, secret);
}

/**
 * Shared constant-time verifier for a hex HMAC-SHA256 of `message`.
 *
 * Returns false for anything that is not an exact match — a missing signature,
 * a wrong secret, a tampered message, a non-hex value, or a length mismatch —
 * and never leaks which part failed through timing.
 */
function verifyHexHmac(
  message: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (typeof signature !== "string") return false;
  if (typeof secret !== "string" || !secret) return false;

  const provided = signature.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(provided)) return false;

  const expected = createHmac("sha256", secret).update(message, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Reads the `event` discriminator (e.g. `payment.captured`) out of a payload. */
export function extractRazorpayEventType(body: unknown): string | null {
  return asNonEmptyString(asRecord(body)?.event);
}

/**
 * Derives a stable idempotency key for an event when the gateway does not send
 * the `X-Razorpay-Event-Id` header. Razorpay sends that header for every event,
 * so this is only a fallback for older/edge deliveries and local replays.
 *
 * The derived key is deterministic for a given body, which is what makes a
 * repeat delivery collapse onto the same stored event.
 */
export function deriveRazorpayEventId(body: unknown, rawBody: string): string {
  const record = asRecord(body);
  const eventType = asNonEmptyString(record?.event) ?? "event";
  const createdAt = record?.created_at;
  const payload = asRecord(record?.payload);
  const paymentId = asNonEmptyString(asRecord(asRecord(payload?.payment)?.entity)?.id);
  const refundId = asNonEmptyString(asRecord(asRecord(payload?.refund)?.entity)?.id);
  const entityId = paymentId ?? refundId;

  if (entityId && createdAt !== undefined && createdAt !== null) {
    return `${eventType}:${String(createdAt)}:${entityId}`;
  }

  return `body:${createHash("sha256").update(rawBody, "utf8").digest("hex")}`;
}
