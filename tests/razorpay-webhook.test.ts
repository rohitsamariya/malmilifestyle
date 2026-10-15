/**
 * Razorpay webhook tests.
 *
 * SAFETY: the database-backed cases run against a throwaway database only. The
 * suite refuses to start unless the resolved database name ends in `_test`, so
 * it can never touch the real `malmi_lifestyle` database.
 *
 * No real payment or refund is ever initiated: every payload is a mocked
 * Razorpay event, signed with a test-only webhook secret.
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test, { after, before } from "node:test";

import {
  deriveRazorpayEventId,
  extractRazorpayEventType,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay";
import {
  evaluateCapturedPayment,
  evaluateFailedPayment,
  handleRazorpayWebhookRequest,
  refundStatusForEvent,
  type WebhookOrderLike,
} from "@/lib/payments/razorpay-webhook";

const WEBHOOK_SECRET = "test-only-razorpay-webhook-secret-do-not-use";
const RAZORPAY_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
};

const TEST_MONGO_URI =
  process.env.MONGODB_TEST_URI ?? "mongodb://127.0.0.1:27017/malmi_lifestyle_test";

const databaseName = (() => {
  try {
    return new URL(TEST_MONGO_URI).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
})();

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run database tests against "${databaseName}". Set MONGODB_TEST_URI to a database whose name ends in _test.`,
  );
}

process.env.MONGODB_URI = TEST_MONGO_URI;

const FIXED_NOW = new Date("2026-10-15T10:00:00.000Z");
const ORDER_TOTAL = 540;
const AMOUNT_PAISE = ORDER_TOTAL * 100;

type DbModule = typeof import("@/lib/db");
type OrderService = typeof import("@/lib/order-service");
type OrderModelModule = typeof import("@/models/Order");
type WebhookEventModule = typeof import("@/models/WebhookEvent");
type OrderRefund = import("@/models/Order").IOrderRefund;

let db: DbModule;
let orders: OrderService;
let OrderModel: OrderModelModule["default"];
let WebhookEventModel: WebhookEventModule["default"];

const address = {
  fullName: "Webhook Tester",
  phone: "9876543210",
  email: "webhook@example.com",
  addressLine1: "12 Test Road",
  addressLine2: "",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
};

const orderItems = [
  {
    productId: "product-webhook",
    variantId: "variant-webhook",
    productSlug: "webhook-product",
    productName: "Webhook Test Product",
    variantSize: "1 L",
    productImage: "/test.jpg",
    unitPrice: ORDER_TOTAL,
    unitMrp: 600,
    quantity: 1,
    itemTotal: ORDER_TOTAL,
  },
];

let orderSeq = 0;

async function createOnlineOrder(opts: {
  gatewayOrderId?: string;
  totalAmount?: number;
  currency?: string | null;
  status?: string;
  method?: string;
} = {}) {
  orderSeq += 1;
  const gatewayOrderId = opts.gatewayOrderId ?? `order_TEST${String(orderSeq).padStart(8, "0")}`;
  const paymentId = `pay_TEST${String(orderSeq).padStart(8, "0")}`;
  const totalAmount = opts.totalAmount ?? ORDER_TOTAL;
  const order = await OrderModel.create({
    orderId: `MALMI-2026-WEBHOOK-${String(orderSeq).padStart(4, "0")}`,
    items: orderItems,
    shippingAddress: address,
    subtotal: totalAmount,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount,
    payment: {
      method: opts.method ?? "RAZORPAY",
      status: opts.status ?? "PENDING",
      gatewayOrderId,
      gatewayPaymentId: null,
      currency: opts.currency === undefined ? "INR" : opts.currency,
    },
    paymentStatus: opts.status ?? "PENDING",
    shipment: { provider: "MANUAL", status: "NOT_CREATED" },
    orderStatus: "PLACED",
    stockRestored: false,
  });
  return { order, gatewayOrderId, paymentId };
}

function sign(raw: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(raw, "utf8").digest("hex");
}

function buildRequest(
  body: unknown,
  opts: { signature?: string | null; eventId?: string | null; raw?: string } = {},
): Request {
  const raw = opts.raw ?? JSON.stringify(body);
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.eventId !== null) headers.set("x-razorpay-event-id", opts.eventId ?? "evt_default");
  if (opts.signature !== null) headers.set("x-razorpay-signature", opts.signature ?? sign(raw));
  return new Request("https://malmilifestyle.onrender.com/api/webhooks/razorpay", {
    method: "POST",
    headers,
    body: raw,
  });
}

function post(
  body: unknown,
  opts: { signature?: string | null; eventId?: string | null; raw?: string; env?: NodeJS.ProcessEnv } = {},
) {
  return handleRazorpayWebhookRequest(buildRequest(body, opts), {
    env: opts.env ?? RAZORPAY_ENV,
    now: FIXED_NOW,
  });
}

function capturedBody(gatewayOrderId: string, overrides: Record<string, unknown> = {}) {
  return {
    entity: "event",
    account_id: "acc_test",
    event: "payment.captured",
    contains: ["payment"],
    created_at: 1760522400,
    payload: {
      payment: {
        entity: {
          id: "pay_TEST0000000001",
          entity: "payment",
          amount: AMOUNT_PAISE,
          currency: "INR",
          status: "captured",
          order_id: gatewayOrderId,
          captured: true,
          method: "card",
          ...overrides,
        },
      },
    },
  };
}

function failedBody(gatewayOrderId: string, overrides: Record<string, unknown> = {}) {
  return {
    entity: "event",
    account_id: "acc_test",
    event: "payment.failed",
    contains: ["payment"],
    created_at: 1760522401,
    payload: {
      payment: {
        entity: {
          id: "pay_TESTFAIL0000001",
          entity: "payment",
          amount: AMOUNT_PAISE,
          currency: "INR",
          status: "failed",
          order_id: gatewayOrderId,
          error_code: "BAD_REQUEST_ERROR",
          error_description: "Payment failed (test)",
          ...overrides,
        },
      },
    },
  };
}

function refundBody(
  eventType: "refund.created" | "refund.processed" | "refund.failed",
  overrides: Record<string, unknown> = {},
) {
  return {
    entity: "event",
    account_id: "acc_test",
    event: eventType,
    contains: ["refund"],
    created_at: 1760522402,
    payload: {
      refund: {
        entity: {
          id: "rfnd_TEST0000000001",
          entity: "refund",
          payment_id: "pay_TEST0000000001",
          amount: AMOUNT_PAISE,
          currency: "INR",
          status: eventType.replace("refund.", ""),
          created_at: 1760522402,
          ...overrides,
        },
      },
    },
  };
}

before(async () => {
  db = await import("@/lib/db");
  orders = await import("@/lib/order-service");
  OrderModel = (await import("@/models/Order")).default;
  WebhookEventModel = (await import("@/models/WebhookEvent")).default;

  await db.connectToDatabase();
  // Wait for indexes so the unique idempotency constraint is in force.
  await Promise.all([OrderModel.init(), WebhookEventModel.init()]);

  await Promise.all([WebhookEventModel.deleteMany({})]);
});

after(async () => {
  if (!db) return;
  await Promise.all([
    WebhookEventModel.deleteMany({}),
    OrderModel.deleteMany({ orderId: /^MALMI-2026-WEBHOOK-/ }),
  ]);
  await db.disconnectDatabase();
});

// ---------------------------------------------------------------------------
// Signature verification (pure)
// ---------------------------------------------------------------------------

test("a correctly signed body verifies", () => {
  const raw = JSON.stringify({ hello: "world" });
  assert.equal(verifyRazorpayWebhookSignature(raw, sign(raw), WEBHOOK_SECRET), true);
  assert.equal(verifyRazorpayWebhookSignature(raw, sign(raw).toUpperCase(), WEBHOOK_SECRET), true);
});

test("a missing, empty or malformed signature is rejected", () => {
  const raw = JSON.stringify({ hello: "world" });
  for (const signature of [null, undefined, "", "   ", "not-hex", "zzzz"]) {
    assert.equal(verifyRazorpayWebhookSignature(raw, signature, WEBHOOK_SECRET), false, String(signature));
  }
});

test("a tampered body or the wrong secret is rejected", () => {
  const raw = JSON.stringify({ amount: 100 });
  const signature = sign(raw);
  assert.equal(verifyRazorpayWebhookSignature(`${raw} `, signature, WEBHOOK_SECRET), false);
  assert.equal(verifyRazorpayWebhookSignature(raw, signature, "a-different-secret"), false);
  // A same-length, valid-hex signature that simply does not match.
  assert.equal(verifyRazorpayWebhookSignature(raw, "a".repeat(64), WEBHOOK_SECRET), false);
});

// ---------------------------------------------------------------------------
// Event parsing (pure)
// ---------------------------------------------------------------------------

test("the event type and id are read from the payload", () => {
  const body = capturedBody("order_TEST00000001");
  assert.equal(extractRazorpayEventType(body), "payment.captured");
  const id = deriveRazorpayEventId(body, JSON.stringify(body));
  assert.equal(id, `payment.captured:1760522400:pay_TEST0000000001`);
  // Deterministic for the same body.
  assert.equal(deriveRazorpayEventId(body, JSON.stringify(body)), id);
});

test("the event id falls back to a stable body digest", () => {
  const body = { event: "payment.captured", payload: {} };
  const raw = JSON.stringify(body);
  const first = deriveRazorpayEventId(body, raw);
  assert.match(first, /^body:[0-9a-f]{64}$/);
  assert.equal(deriveRazorpayEventId(body, raw), first);
});

// ---------------------------------------------------------------------------
// Decision logic (pure)
// ---------------------------------------------------------------------------

function orderLike(overrides: Partial<WebhookOrderLike["payment"]> = {}): WebhookOrderLike {
  return {
    orderId: "MALMI-2026-X",
    totalAmount: ORDER_TOTAL,
    payment: {
      method: "RAZORPAY",
      status: "PENDING",
      currency: "INR",
      gatewayOrderId: "order_X",
      gatewayPaymentId: null,
      ...overrides,
    },
  };
}

const capturedEntity = { id: "pay_1", status: "captured", amount: AMOUNT_PAISE, currency: "INR" };

test("a captured payment matching the order amount and currency is applied", () => {
  assert.deepEqual(evaluateCapturedPayment(orderLike(), capturedEntity), {
    apply: true,
    reason: "captured",
  });
});

test("an amount or currency mismatch is refused", () => {
  assert.equal(evaluateCapturedPayment(orderLike(), { ...capturedEntity, amount: 1 }).reason, "amount_mismatch");
  assert.equal(evaluateCapturedPayment(orderLike(), { ...capturedEntity, currency: "USD" }).reason, "currency_mismatch");
});

test("a COD order is never settled by an online payment event", () => {
  assert.equal(evaluateCapturedPayment(orderLike({ method: "COD" }), capturedEntity).reason, "not_online_order");
  assert.equal(
    evaluateFailedPayment(orderLike({ method: "COD" }), { id: "pay_1" }).reason,
    "not_online_order",
  );
});

test("an already-paid order is never re-applied", () => {
  assert.equal(
    evaluateCapturedPayment(orderLike({ status: "PAID" }), capturedEntity).reason,
    "already_paid",
  );
});

test("failed payments never apply to a paid order", () => {
  assert.equal(evaluateFailedPayment(orderLike({ status: "PAID" }), { id: "pay_1" }).reason, "already_paid");
  assert.deepEqual(evaluateFailedPayment(orderLike(), { id: "pay_1" }), { apply: true, reason: "failed" });
});

test("refund event types map to normalized states", () => {
  assert.equal(refundStatusForEvent("refund.created"), "CREATED");
  assert.equal(refundStatusForEvent("refund.processed"), "PROCESSED");
  assert.equal(refundStatusForEvent("refund.failed"), "FAILED");
});

// ---------------------------------------------------------------------------
// Request pipeline — signature errors (no database required)
// ---------------------------------------------------------------------------

test("a request without a signature is rejected before any processing", async () => {
  const result = await post(capturedBody("order_TEST00000001"), { signature: null });
  assert.equal(result.status, 400);
});

test("a request with an invalid signature is rejected", async () => {
  const result = await post(capturedBody("order_TEST00000001"), { signature: "deadbeef" });
  assert.equal(result.status, 400);
});

test("a signed but malformed body is rejected", async () => {
  const result = await post(null, { raw: "{ this is not json", eventId: "evt_malformed" });
  assert.equal(result.status, 400);
});

test("a payload without an event type is rejected", async () => {
  const result = await post({ entity: "event", payload: {} }, { eventId: "evt_no_type" });
  assert.equal(result.status, 400);
});

test("an unconfigured webhook secret fails closed with a server error", async () => {
  const result = await post(capturedBody("order_TEST00000001"), {
    env: { NODE_ENV: "test" } as NodeJS.ProcessEnv,
    eventId: "evt_unconfigured",
  });
  assert.equal(result.status, 500);
});

// ---------------------------------------------------------------------------
// Request pipeline — database-backed processing
// ---------------------------------------------------------------------------

test("a captured payment marks the matching order paid", async () => {
  const { order, gatewayOrderId, paymentId } = await createOnlineOrder();
  const result = await post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId: "evt_captured_ok" });
  assert.equal(result.status, 200);

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID");
  assert.equal(stored?.payment.status, "PAID");
  assert.equal(stored?.payment.gatewayPaymentId, paymentId);
  assert.ok(stored?.paidAt);
});

test("an amount mismatch is acknowledged but changes nothing", async () => {
  const { order, gatewayOrderId } = await createOnlineOrder();
  const result = await post(capturedBody(gatewayOrderId, { amount: AMOUNT_PAISE + 100 }), {
    eventId: "evt_amount_mismatch",
  });
  assert.equal(result.status, 200);

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PENDING");
  assert.equal(stored?.payment.status, "PENDING");
  assert.equal(stored?.paidAt ?? null, null);
});

test("a currency mismatch is refused", async () => {
  const { order, gatewayOrderId } = await createOnlineOrder();
  const result = await post(capturedBody(gatewayOrderId, { currency: "USD" }), {
    eventId: "evt_currency_mismatch",
  });
  assert.equal(result.status, 200);

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PENDING");
});

test("an unknown payment reference is ignored without creating anything", async () => {
  const before = await OrderModel.countDocuments({ orderId: /^MALMI-2026-WEBHOOK-/ });
  const result = await post(capturedBody("order_DOESNOTEXIST000"), { eventId: "evt_unknown_order" });
  assert.equal(result.status, 200);

  const afterCount = await OrderModel.countDocuments({ orderId: /^MALMI-2026-WEBHOOK-/ });
  assert.equal(afterCount, before, "no order may be created by a webhook");
});

test("a repeat delivery is idempotent and does not re-stamp paidAt", async () => {
  const { order, gatewayOrderId, paymentId } = await createOnlineOrder();
  const eventId = "evt_duplicate";

  const first = await post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId });
  const second = await post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID");
  assert.equal(stored?.paidAt?.toISOString(), FIXED_NOW.toISOString());

  const events = await WebhookEventModel.countDocuments({ eventId });
  assert.equal(events, 1, "one durable record per gateway event");
});

test("concurrent delivery of the same event is processed once", async () => {
  const { order, gatewayOrderId, paymentId } = await createOnlineOrder();
  const eventId = "evt_concurrent";

  const [a, b] = await Promise.all([
    post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId }),
    post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId }),
  ]);

  assert.ok(a.status === 200 || b.status === 200, "at least one delivery must succeed");

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID");

  const events = await WebhookEventModel.countDocuments({ eventId });
  assert.equal(events, 1);
  const record = await WebhookEventModel.findOne({ eventId }).lean();
  assert.equal(record?.status, "PROCESSED");
});

test("a failed payment is recorded and never marks the order paid", async () => {
  const { order, gatewayOrderId, paymentId } = await createOnlineOrder();
  const result = await post(failedBody(gatewayOrderId, { id: paymentId }), { eventId: "evt_failed" });
  assert.equal(result.status, 200);

  let stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "FAILED");
  assert.equal(stored?.payment.status, "FAILED");
  assert.equal(stored?.paidAt ?? null, null);

  // A later capture for the same order may still succeed.
  const capture = await post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId: "evt_failed_then_paid" });
  assert.equal(capture.status, 200);
  stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID");
});

test("refund events are recorded against the order without changing its payment state", async () => {
  const { order, gatewayOrderId, paymentId } = await createOnlineOrder();
  await post(capturedBody(gatewayOrderId, { id: paymentId }), { eventId: "evt_refund_capture" });

  const created = await post(refundBody("refund.created", { payment_id: paymentId }), {
    eventId: "evt_refund_created",
  });
  const processed = await post(refundBody("refund.processed", { payment_id: paymentId }), {
    eventId: "evt_refund_processed",
  });
  assert.equal(created.status, 200);
  assert.equal(processed.status, 200);

  // A second, distinct refund that fails.
  await post(
    refundBody("refund.failed", { id: "rfnd_TEST0000000002", payment_id: paymentId, status: "failed" }),
    { eventId: "evt_refund_failed" },
  );

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID", "a refund must not alter the payment status");
  assert.equal(stored?.refunds.length, 2);

  const first = stored?.refunds.find((refund: OrderRefund) => refund.refundId === "rfnd_TEST0000000001");
  assert.equal(first?.status, "PROCESSED", "created then processed updates one row");
  assert.equal(first?.amount, AMOUNT_PAISE);

  const second = stored?.refunds.find((refund: OrderRefund) => refund.refundId === "rfnd_TEST0000000002");
  assert.equal(second?.status, "FAILED");
});

test("the COD delivery rule never settles an online order", async () => {
  const { order } = await createOnlineOrder();
  await orders.updateOrderStatus(order.orderId, "PACKED");
  await orders.updateOrderStatus(order.orderId, "SHIPPED");
  const delivered = await orders.updateOrderStatus(order.orderId, "DELIVERED");

  assert.equal(delivered.orderStatus, "DELIVERED");
  assert.equal(delivered.paymentStatus, "PENDING", "only the gateway may settle an online payment");
  assert.equal(delivered.payment.status, "PENDING");
});
