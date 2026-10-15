/**
 * Razorpay webhook processing.
 *
 * Design rules this module upholds:
 *  - The webhook only ever *updates payment state*. It never creates an order
 *    and never touches stock — the checkout flow already did both before a
 *    payment could be attempted.
 *  - Every event is deduplicated through the durable `WebhookEvent` collection.
 *    A repeat or concurrent delivery cannot apply the same change twice.
 *  - An event is only marked processed after its database change is committed.
 *    Transient failures return "retry" so Razorpay redelivers.
 *  - Order updates are themselves guarded (compare-and-set on payment status),
 *    so even a lost dedup race cannot double-apply.
 *
 * The order association uses the server-created Razorpay order id
 * (`payment.gatewayOrderId`, `order_...`) supplied by the gateway — never
 * anything the browser sent. Amount and currency are re-checked against the
 * server-side order before a payment is accepted.
 */

import connectToDatabase from "@/lib/db";
import {
  RAZORPAY_EVENT_ID_HEADER,
  RAZORPAY_SIGNATURE_HEADER,
  deriveRazorpayEventId,
  extractRazorpayEventType,
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay";
import OrderModel from "@/models/Order";
import WebhookEventModel from "@/models/WebhookEvent";

const PROVIDER = "razorpay" as const;

/** A processing lock older than this is assumed dead and may be taken over. */
export const DEFAULT_STALE_LOCK_MS = 5 * 60 * 1000;

export type RazorpayWebhookResult =
  | { kind: "processed"; reason: string }
  | { kind: "ignored"; reason: string }
  | { kind: "duplicate" }
  | { kind: "in_flight" }
  | { kind: "retry"; reason: string };

export interface WebhookHttpResult {
  status: number;
  body: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isDuplicateKeyError(error: unknown): boolean {
  return isRecord(error) && error.code === 11000;
}

/** The slice of an order this module needs to make a decision. */
export interface WebhookOrderLike {
  orderId: string;
  totalAmount: number;
  payment?: {
    method?: string;
    status?: string;
    currency?: string | null;
    gatewayOrderId?: string | null;
    gatewayPaymentId?: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Pure decision logic (unit-testable without a database)
// ---------------------------------------------------------------------------

export interface PaymentDecision {
  apply: boolean;
  reason: string;
}

/**
 * Decides whether a `payment.captured` entity may mark `order` as paid.
 *
 * A valid webhook signature authenticates the *message*; it says nothing about
 * whether this payment belongs to this order or matches its amount. Those
 * consistency checks live here.
 */
export function evaluateCapturedPayment(
  order: WebhookOrderLike,
  entity: Record<string, unknown>,
): PaymentDecision {
  if (order.payment?.method !== "RAZORPAY") return { apply: false, reason: "not_online_order" };

  const paymentId = asString(entity.id);
  if (!paymentId) return { apply: false, reason: "missing_payment_id" };

  const entityStatus = asString(entity.status);
  if (entityStatus && entityStatus !== "captured") {
    return { apply: false, reason: "not_captured" };
  }

  const amount = asFiniteNumber(entity.amount);
  const currency = asString(entity.currency);
  if (amount === null || !currency) return { apply: false, reason: "missing_amount_or_currency" };

  const expectedAmount = Math.round(order.totalAmount * 100);
  if (amount !== expectedAmount) return { apply: false, reason: "amount_mismatch" };

  const expectedCurrency = order.payment.currency ?? "INR";
  if (currency !== expectedCurrency) return { apply: false, reason: "currency_mismatch" };

  if (order.payment.status === "PAID") {
    // A second, different payment for an already-paid order is never applied.
    return { apply: false, reason: "already_paid" };
  }

  return { apply: true, reason: "captured" };
}

/** Decides whether a `payment.failed` entity may mark `order` as failed. */
export function evaluateFailedPayment(
  order: WebhookOrderLike,
  entity: Record<string, unknown>,
): PaymentDecision {
  if (order.payment?.method !== "RAZORPAY") return { apply: false, reason: "not_online_order" };
  if (!asString(entity.id)) return { apply: false, reason: "missing_payment_id" };
  if (order.payment.status === "PAID") return { apply: false, reason: "already_paid" };
  if (order.payment.status === "FAILED") return { apply: false, reason: "already_failed" };
  return { apply: true, reason: "failed" };
}

export type RefundStatus = "CREATED" | "PROCESSED" | "FAILED";

/** Maps a refund webhook event type to Malmi's normalized refund state. */
export function refundStatusForEvent(eventType: string): RefundStatus {
  if (eventType === "refund.processed") return "PROCESSED";
  if (eventType === "refund.failed") return "FAILED";
  return "CREATED";
}

// ---------------------------------------------------------------------------
// Durable idempotency
// ---------------------------------------------------------------------------

type ClaimState = "claimed" | "duplicate" | "in_flight";

interface ClaimResult {
  state: ClaimState;
  recordId?: unknown;
}

async function claimEvent(
  eventId: string,
  eventType: string,
  staleLockMs: number,
): Promise<ClaimResult> {
  try {
    const created = await WebhookEventModel.create({
      provider: PROVIDER,
      eventId,
      eventType,
      status: "PROCESSING",
      attempts: 1,
      lockedAt: new Date(),
    });
    return { state: "claimed", recordId: created._id };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  const existing = await WebhookEventModel.findOne({ provider: PROVIDER, eventId }).lean();
  if (!existing) return { state: "in_flight" };

  // Already finished: a repeat delivery is a no-op.
  if (existing.status === "PROCESSED" || existing.status === "IGNORED") {
    return { state: "duplicate" };
  }

  // A previously failed event may be retried immediately. A still-"PROCESSING"
  // event may only be taken over once its lock has gone stale, so a concurrent
  // duplicate cannot run side by side.
  const filter: Record<string, unknown> = { _id: existing._id };
  if (existing.status === "FAILED") {
    filter.status = "FAILED";
  } else {
    filter.status = "PROCESSING";
    filter.lockedAt = { $lt: new Date(Date.now() - staleLockMs) };
  }

  const reacquired = await WebhookEventModel.findOneAndUpdate(
    filter,
    { $set: { status: "PROCESSING", lockedAt: new Date(), reason: null }, $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );

  return reacquired ? { state: "claimed", recordId: reacquired._id } : { state: "in_flight" };
}

async function finalizeEvent(
  recordId: unknown,
  status: "PROCESSED" | "IGNORED" | "FAILED",
  reason: string,
): Promise<void> {
  await WebhookEventModel.updateOne(
    { _id: recordId },
    {
      $set: {
        status,
        reason,
        processedAt: status === "FAILED" ? null : new Date(),
        lockedAt: null,
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

export interface EventOutcome {
  applied: boolean;
  reason: string;
}

/**
 * Applies a captured Razorpay payment to the order its `order_id` points at.
 *
 * Shared by the webhook and the client handoff verification so both converge on
 * the exact same guarded, idempotent write. The lookup is by the server-created
 * `payment.gatewayOrderId`; amount and currency are re-checked against the
 * stored order before anything is written.
 */
export async function applyRazorpayCapturedPayment(
  entity: Record<string, unknown>,
  now: Date,
): Promise<EventOutcome> {
  const gatewayOrderId = asString(entity.order_id);
  const paymentId = asString(entity.id);
  if (!gatewayOrderId || !paymentId) return { applied: false, reason: "missing_reference" };

  const order = (await OrderModel.findOne({ "payment.gatewayOrderId": gatewayOrderId })
    .select("orderId totalAmount payment")
    .lean()) as WebhookOrderLike | null;
  if (!order) return { applied: false, reason: "order_not_found" };

  const decision = evaluateCapturedPayment(order, entity);
  if (!decision.apply) return { applied: false, reason: decision.reason };

  // Compare-and-set: only a non-PAID online order can be moved to PAID, so a
  // duplicate that slipped past dedup still cannot re-apply or re-stamp paidAt.
  const updated = await OrderModel.findOneAndUpdate(
    {
      orderId: order.orderId,
      "payment.gatewayOrderId": gatewayOrderId,
      "payment.method": "RAZORPAY",
      "payment.status": { $ne: "PAID" },
    },
    {
      $set: {
        "payment.status": "PAID",
        "payment.gatewayPaymentId": paymentId,
        paymentStatus: "PAID",
        paidAt: now,
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) return { applied: false, reason: "already_paid" };
  return { applied: true, reason: "payment_captured" };
}

async function applyFailedPayment(
  entity: Record<string, unknown>,
): Promise<EventOutcome> {
  const gatewayOrderId = asString(entity.order_id);
  if (!gatewayOrderId) return { applied: false, reason: "missing_reference" };

  const order = (await OrderModel.findOne({ "payment.gatewayOrderId": gatewayOrderId })
    .select("orderId totalAmount payment")
    .lean()) as WebhookOrderLike | null;
  if (!order) return { applied: false, reason: "order_not_found" };

  const decision = evaluateFailedPayment(order, entity);
  if (!decision.apply) return { applied: false, reason: decision.reason };

  // A failure must never mark an order paid, and never overwrites a PAID order.
  const updated = await OrderModel.findOneAndUpdate(
    {
      orderId: order.orderId,
      "payment.method": "RAZORPAY",
      "payment.status": "PENDING",
    },
    { $set: { "payment.status": "FAILED", paymentStatus: "FAILED" } },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) return { applied: false, reason: "not_pending" };
  return { applied: true, reason: "payment_failed" };
}

async function applyRefund(
  eventType: string,
  entity: Record<string, unknown>,
  now: Date,
): Promise<EventOutcome> {
  const refundId = asString(entity.id);
  const paymentId = asString(entity.payment_id);
  if (!refundId || !paymentId) return { applied: false, reason: "missing_reference" };

  const order = await OrderModel.findOne({ "payment.gatewayPaymentId": paymentId })
    .select("orderId")
    .lean();
  if (!order) return { applied: false, reason: "order_not_found" };

  const status = refundStatusForEvent(eventType);
  const amount = asFiniteNumber(entity.amount);
  const currency = asString(entity.currency) ?? "INR";
  const gatewayStatus = asString(entity.status);
  const gatewayCreatedAtRaw = asFiniteNumber(entity.created_at);
  const createdAt = gatewayCreatedAtRaw === null ? now : new Date(gatewayCreatedAtRaw * 1000);

  // Update the existing refund row if present, otherwise append one. The
  // refundId is the natural key, so created -> processed -> failed updates the
  // same row instead of stacking duplicates. Refunds only ever record what the
  // gateway reports; Malmi never marks an order refunded or cancelled here.
  const existing = await OrderModel.updateOne(
    { orderId: order.orderId, "refunds.refundId": refundId },
    {
      $set: {
        "refunds.$.status": status,
        "refunds.$.amount": amount,
        "refunds.$.currency": currency,
        "refunds.$.gatewayStatus": gatewayStatus,
        "refunds.$.updatedAt": now,
      },
    },
  );

  if (existing.matchedCount === 0) {
    await OrderModel.updateOne(
      { orderId: order.orderId },
      {
        $push: {
          refunds: {
            refundId,
            paymentId,
            amount,
            currency,
            status,
            gatewayStatus,
            createdAt,
            updatedAt: now,
          },
        },
      },
      { runValidators: true },
    );
  }

  return { applied: true, reason: `refund_${status.toLowerCase()}` };
}

async function handleEvent(
  eventType: string,
  payload: unknown,
  now: Date,
): Promise<EventOutcome> {
  const payloadRecord = isRecord(payload) ? payload.payload : null;
  if (!isRecord(payloadRecord)) return { applied: false, reason: "invalid_payload" };

  if (eventType === "payment.captured") {
    const entity = isRecord(payloadRecord.payment) ? payloadRecord.payment.entity : null;
    if (!isRecord(entity)) return { applied: false, reason: "missing_payment_entity" };
    return applyRazorpayCapturedPayment(entity, now);
  }

  if (eventType === "payment.failed") {
    const entity = isRecord(payloadRecord.payment) ? payloadRecord.payment.entity : null;
    if (!isRecord(entity)) return { applied: false, reason: "missing_payment_entity" };
    return applyFailedPayment(entity);
  }

  if (eventType === "refund.created" || eventType === "refund.processed" || eventType === "refund.failed") {
    const entity = isRecord(payloadRecord.refund) ? payloadRecord.refund.entity : null;
    if (!isRecord(entity)) return { applied: false, reason: "missing_refund_entity" };
    return applyRefund(eventType, entity, now);
  }

  return { applied: false, reason: "unsupported_event" };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface ProcessWebhookInput {
  eventId: string;
  eventType: string;
  payload: unknown;
}

export interface ProcessWebhookOptions {
  now?: Date;
  staleLockMs?: number;
}

/**
 * Deduplicates and applies a single webhook event.
 *
 * Ordering guarantee: the event is claimed *before* its side effects run and is
 * only marked PROCESSED after they commit. A transient failure marks it FAILED
 * and reports "retry", so Razorpay can redeliver and the event can be re-taken.
 */
export async function processRazorpayWebhook(
  input: ProcessWebhookInput,
  options: ProcessWebhookOptions = {},
): Promise<RazorpayWebhookResult> {
  await connectToDatabase();

  const staleLockMs = options.staleLockMs ?? DEFAULT_STALE_LOCK_MS;
  const now = options.now ?? new Date();

  const claim = await claimEvent(input.eventId, input.eventType, staleLockMs);
  if (claim.state === "duplicate") return { kind: "duplicate" };
  if (claim.state === "in_flight") return { kind: "in_flight" };

  try {
    const outcome = await handleEvent(input.eventType, input.payload, now);
    await finalizeEvent(claim.recordId, outcome.applied ? "PROCESSED" : "IGNORED", outcome.reason);
    return outcome.applied
      ? { kind: "processed", reason: outcome.reason }
      : { kind: "ignored", reason: outcome.reason };
  } catch {
    // Leave a retryable trail and let the caller answer non-2xx so Razorpay
    // redelivers. The failure reason is intentionally generic: it may be a
    // database outage, and no payload or credential detail should be leaked.
    await finalizeEvent(claim.recordId, "FAILED", "processing_error").catch(() => undefined);
    return { kind: "retry", reason: "processing_error" };
  }
}

// ---------------------------------------------------------------------------
// HTTP glue (framework-agnostic so it can be unit-tested without Next.js)
// ---------------------------------------------------------------------------

export interface HandleWebhookOptions extends ProcessWebhookOptions {
  env?: NodeJS.ProcessEnv;
}

/**
 * Full request pipeline: read the raw body, verify the signature, then process.
 * Reads the body as text *before* parsing so the HMAC is computed over exactly
 * the bytes the gateway signed.
 */
export async function handleRazorpayWebhookRequest(
  request: Request,
  options: HandleWebhookOptions = {},
): Promise<WebhookHttpResult> {
  const env = options.env ?? process.env;

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return { status: 400, body: { error: "Unable to read request body." } };
  }

  const signature = request.headers.get(RAZORPAY_SIGNATURE_HEADER);
  if (!signature) {
    return { status: 400, body: { error: "Missing signature." } };
  }

  let secret: string;
  try {
    secret = getRazorpayWebhookSecret(env);
  } catch {
    return { status: 500, body: { error: "Webhook is not configured." } };
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return { status: 400, body: { error: "Invalid signature." } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "Malformed payload." } };
  }

  const eventType = extractRazorpayEventType(parsed);
  if (!eventType) {
    return { status: 400, body: { error: "Malformed payload." } };
  }

  const headerEventId = request.headers.get(RAZORPAY_EVENT_ID_HEADER)?.trim();
  const eventId = headerEventId || deriveRazorpayEventId(parsed, rawBody);

  let result: RazorpayWebhookResult;
  try {
    result = await processRazorpayWebhook(
      { eventId, eventType, payload: parsed },
      { now: options.now, staleLockMs: options.staleLockMs },
    );
  } catch {
    return { status: 500, body: { error: "Unable to process event." } };
  }

  if (result.kind === "in_flight") {
    return { status: 409, body: { error: "Event is already being processed." } };
  }
  if (result.kind === "retry") {
    return { status: 500, body: { error: "Unable to process event. Please retry." } };
  }

  // Processed, ignored and duplicate all answer 200: the event is committed or
  // deliberately not actionable, so there is nothing for Razorpay to retry.
  return { status: 200, body: { received: true } };
}
