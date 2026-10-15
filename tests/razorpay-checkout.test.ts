/**
 * Tests for the Razorpay checkout flow: server-side gateway order creation and
 * the client handoff verification.
 *
 * SAFETY: the database tests run against a throwaway database only. The suite
 * refuses to start unless the resolved database name ends in `_test`.
 *
 * The Razorpay REST API is replaced by a local stub HTTP server, so no live
 * credentials or network access are used. The key id/secret are fake test values.
 */

import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import http from "node:http";
import { createHmac } from "node:crypto";
import type { AddressInfo } from "node:net";

process.env.SESSION_SECRET = "test-only-session-secret-do-not-use-in-production";

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

const KEY_ID = "rzp_test_malmi_key";
const KEY_SECRET = "test_key_secret_do_not_use";

process.env.RAZORPAY_KEY_ID = KEY_ID;
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

type DbModule = typeof import("@/lib/db");
type OrderService = typeof import("@/lib/order-service");
type RazorpayApi = typeof import("@/lib/payments/razorpay-api");
type OrderModelModule = typeof import("@/models/Order");
type ProductModelModule = typeof import("@/models/Product");
type CategoryModelModule = typeof import("@/models/Category");

let db: DbModule;
let orders: OrderService;
let razorpayApi: RazorpayApi;
let OrderModel: OrderModelModule["default"];
let ProductModel: ProductModelModule["default"];
let CategoryModel: CategoryModelModule["default"];

const CATEGORY_ID = "test-category-checkout";
const PRODUCT_ID = "test-product-checkout";
const VARIANT_ID = "test-variant-checkout";
const UNIT_PRICE = 540;

const address = {
  fullName: "Asha Rao",
  phone: "9876543210",
  email: "asha@example.com",
  addressLine1: "12 Test Road",
  addressLine2: "",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
};

// ---------------------------------------------------------------------------
// Local Razorpay stub
// ---------------------------------------------------------------------------

let server: http.Server;
let apiBaseUrl = "";

interface RecordedOrderRequest {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}
const createdOrderRequests: RecordedOrderRequest[] = [];
const createdOrderAuthHeaders: Array<string | undefined> = [];
const payments = new Map<string, Record<string, unknown>>();
let paymentFetchCount = 0;

function startStubServer(): Promise<void> {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const url = req.url ?? "";
      const send = (status: number, payload: unknown) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
      };

      if (req.method === "POST" && url === "/v1/orders") {
        const body = JSON.parse(raw || "{}") as RecordedOrderRequest;
        createdOrderRequests.push(body);
        createdOrderAuthHeaders.push(req.headers.authorization);
        const id = `order_TEST${String(createdOrderRequests.length).padStart(6, "0")}`;
        send(200, {
          id,
          entity: "order",
          amount: body.amount,
          currency: body.currency,
          receipt: body.receipt,
          status: "created",
        });
        return;
      }

      const match = url.match(/^\/v1\/payments\/([^/?]+)/);
      if (req.method === "GET" && match) {
        paymentFetchCount += 1;
        const paymentId = decodeURIComponent(match[1]);
        const payment = payments.get(paymentId);
        if (!payment) {
          send(404, { error: { description: "payment not found" } });
          return;
        }
        send(200, payment);
        return;
      }

      send(404, { error: { description: "not found" } });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      apiBaseUrl = `http://127.0.0.1:${port}`;
      process.env.RAZORPAY_API_BASE_URL = apiBaseUrl;
      resolve();
    });
  });
}

function checkoutSignature(orderId: string, paymentId: string, secret = KEY_SECRET) {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`, "utf8").digest("hex");
}

function registerPayment(paymentId: string, orderId: string, overrides: Record<string, unknown> = {}) {
  payments.set(paymentId, {
    id: paymentId,
    entity: "payment",
    amount: UNIT_PRICE * 100,
    currency: "INR",
    status: "captured",
    order_id: orderId,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let orderCounter = 0;
let transactionsAvailable = false;

async function insertOnlineOrder(gatewayOrderId: string, customerId: string, overrides: Record<string, unknown> = {}) {
  orderCounter += 1;
  return OrderModel.create({
    orderId: `MALMI-2026-RZP-${String(orderCounter).padStart(4, "0")}`,
    customerId,
    items: [
      {
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        productSlug: "test-cold-pressed-oil",
        productName: "Test Cold Pressed Oil",
        variantSize: "1 L",
        productImage: "/test.jpg",
        unitPrice: UNIT_PRICE,
        unitMrp: 600,
        quantity: 1,
        itemTotal: UNIT_PRICE,
      },
    ],
    shippingAddress: address,
    subtotal: UNIT_PRICE,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: UNIT_PRICE,
    payment: { method: "RAZORPAY", status: "PENDING", gatewayOrderId, currency: "INR" },
    paymentStatus: "PENDING",
    shipment: { provider: "MANUAL", status: "NOT_CREATED" },
    orderStatus: "PLACED",
    stockRestored: false,
    ...overrides,
  });
}

async function canUseTransactions(): Promise<boolean> {
  const mongoose = (await import("mongoose")).default;
  const hello = (await mongoose.connection.db!.admin().command({ hello: 1 })) as {
    setName?: string;
    msg?: string;
  };
  return Boolean(hello.setName) || hello.msg === "isdbgrid";
}

function onlineRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: "test-online-key-abcdefgh",
    paymentMethod: "RAZORPAY",
    items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 }],
    shippingAddress: address,
    ...overrides,
  };
}

before(async () => {
  await startStubServer();

  db = await import("@/lib/db");
  orders = await import("@/lib/order-service");
  razorpayApi = await import("@/lib/payments/razorpay-api");
  OrderModel = (await import("@/models/Order")).default;
  ProductModel = (await import("@/models/Product")).default;
  CategoryModel = (await import("@/models/Category")).default;

  await db.connectToDatabase();
  await Promise.all([
    OrderModel.deleteMany({}),
    ProductModel.deleteMany({ productId: PRODUCT_ID }),
    CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
  ]);

  await CategoryModel.create({
    categoryId: CATEGORY_ID,
    name: "Test Checkout",
    slug: "test-checkout",
    shortName: "Checkout",
    description: "Fixture category used only by the test suite.",
    image: "/test.jpg",
    isActive: true,
    sortOrder: 0,
  });

  await ProductModel.create({
    productId: PRODUCT_ID,
    categoryId: CATEGORY_ID,
    categorySlug: "test-checkout",
    category: "Test Checkout",
    name: "Test Cold Pressed Oil",
    slug: "test-checkout-oil",
    description: "Fixture product used only by the test suite.",
    price: UNIT_PRICE,
    compareAtPrice: 600,
    rating: null,
    reviewCount: null,
    badge: null,
    isActive: true,
    variants: [
      {
        variantId: VARIANT_ID,
        size: "1 L",
        price: UNIT_PRICE,
        compareAtPrice: 600,
        stock: 50,
        isActive: true,
        image: "/test.jpg",
      },
    ],
  });

  transactionsAvailable = await canUseTransactions();
});

after(async () => {
  if (db) {
    await Promise.all([
      OrderModel.deleteMany({}),
      ProductModel.deleteMany({ productId: PRODUCT_ID }),
      CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
    ]);
    await db.disconnectDatabase();
  }
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// ---------------------------------------------------------------------------
// Razorpay REST client
// ---------------------------------------------------------------------------

test("the Razorpay client creates an order with basic auth and reads a payment back", async () => {
  const order = await razorpayApi.createRazorpayOrder({
    amount: 12345,
    currency: "INR",
    receipt: "MALMI-CLIENT-1",
    notes: { orderId: "MALMI-CLIENT-1" },
  });

  assert.match(order.id, /^order_TEST\d+$/);
  assert.equal(order.amount, 12345);
  assert.equal(order.currency, "INR");

  const expectedAuth = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`, "utf8").toString("base64")}`;
  assert.equal(createdOrderAuthHeaders.at(-1), expectedAuth, "the key secret is used only in the auth header");
  assert.deepEqual(createdOrderRequests.at(-1), {
    amount: 12345,
    currency: "INR",
    receipt: "MALMI-CLIENT-1",
    notes: { orderId: "MALMI-CLIENT-1" },
  });

  registerPayment("pay_CLIENT0001", order.id);
  const payment = await razorpayApi.fetchRazorpayPayment("pay_CLIENT0001");
  assert.equal(payment.id, "pay_CLIENT0001");
  assert.equal(payment.order_id, order.id);
  assert.equal(payment.amount, UNIT_PRICE * 100);
  assert.equal(payment.status, "captured");
});

test("a missing payment surfaces as a RazorpayApiError", async () => {
  await assert.rejects(
    () => razorpayApi.fetchRazorpayPayment("pay_missing0001"),
    (error: unknown) => error instanceof razorpayApi.RazorpayApiError && error.status === 404,
  );
});

// ---------------------------------------------------------------------------
// Entry-point guards (no database work)
// ---------------------------------------------------------------------------

test("online order creation requires a customer and the online method", async () => {
  await assert.rejects(
    () => orders.createOnlineOrder(onlineRequest(), ""),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 401,
  );
  await assert.rejects(
    () => orders.createOnlineOrder(onlineRequest({ paymentMethod: "COD" }), "65f0c0a1b2c3d4e5f6071829"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
});

test("the COD entry point refuses an online request", async () => {
  await assert.rejects(
    () => orders.createCodOrder(onlineRequest(), "65f0c0a1b2c3d4e5f6071829"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
});

// ---------------------------------------------------------------------------
// Full creation path (needs transactions)
// ---------------------------------------------------------------------------

test("creating an online order reserves stock and stores a gateway order", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const customerId = "65f0c0a1b2c3d4e5f6071830";
  const stockBefore = (await ProductModel.findOne({ productId: PRODUCT_ID }).lean())!.variants[0].stock;
  const ordersBefore = createdOrderRequests.length;

  const { order, checkout } = await orders.createOnlineOrder(
    onlineRequest({ idempotencyKey: "online-create-key-abcdef" }),
    customerId,
  );

  assert.equal(order.payment.method, "RAZORPAY");
  assert.equal(order.payment.status, "PENDING");
  assert.match(checkout.razorpayOrderId, /^order_TEST\d+$/);
  assert.equal(checkout.keyId, KEY_ID);
  assert.equal(checkout.amount, UNIT_PRICE * 100);
  assert.equal(checkout.currency, "INR");
  assert.equal(createdOrderRequests.length, ordersBefore + 1, "exactly one gateway order is created");
  assert.equal(createdOrderRequests.at(-1)?.receipt, order.orderId);

  // The gateway order id is persisted server-side before it is handed out.
  const persisted = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(persisted?.payment.gatewayOrderId, checkout.razorpayOrderId);

  const stockAfter = (await ProductModel.findOne({ productId: PRODUCT_ID }).lean())!.variants[0].stock;
  assert.equal(stockAfter, stockBefore - 1, "stock is reserved when the order is created");

  // Replaying the idempotency key reuses the order and the gateway order.
  const replay = await orders.createOnlineOrder(
    onlineRequest({ idempotencyKey: "online-create-key-abcdef" }),
    customerId,
  );
  assert.equal(replay.order.orderId, order.orderId);
  assert.equal(replay.checkout.razorpayOrderId, checkout.razorpayOrderId);
  assert.equal(createdOrderRequests.length, ordersBefore + 1, "a replay must not create a second gateway order");

  const stockAfterReplay = (await ProductModel.findOne({ productId: PRODUCT_ID }).lean())!.variants[0].stock;
  assert.equal(stockAfterReplay, stockBefore - 1, "a replay must not deduct stock again");
});

test("a checkout key cannot be reused across payment methods", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const codRequest = (key: string) => ({
    idempotencyKey: key,
    paymentMethod: "COD",
    items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 }],
    shippingAddress: address,
  });

  // --- COD order, then an online attempt reusing the same key ---
  const codCustomer = "65f0c0a1b2c3d4e5f6071850";
  const codKey = "cross-method-cod-key-abcdef";
  const codOrder = await orders.createCodOrder(codRequest(codKey), codCustomer);
  assert.equal(codOrder.payment.method, "COD");

  const gatewayOrdersBefore = createdOrderRequests.length;
  await assert.rejects(
    () => orders.createOnlineOrder(onlineRequest({ idempotencyKey: codKey }), codCustomer),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
    "reusing a COD key for an online checkout must be refused",
  );
  assert.equal(
    createdOrderRequests.length,
    gatewayOrdersBefore,
    "no gateway order may be created for an existing COD order",
  );
  const codStored = await OrderModel.findOne({ orderId: codOrder.orderId }).lean();
  assert.equal(codStored?.payment.method, "COD");
  assert.equal(codStored?.payment.gatewayOrderId ?? null, null, "a COD order must never gain a gateway order");

  // --- Online order, then a COD attempt reusing the same key ---
  const onlineCustomer = "65f0c0a1b2c3d4e5f6071851";
  const onlineKey = "cross-method-online-key-abcd";
  const { order: onlineOrder } = await orders.createOnlineOrder(
    onlineRequest({ idempotencyKey: onlineKey }),
    onlineCustomer,
  );
  assert.equal(onlineOrder.payment.method, "RAZORPAY");

  await assert.rejects(
    () => orders.createCodOrder(codRequest(onlineKey), onlineCustomer),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
    "reusing an online key for a COD checkout must be refused, not silently treated as COD",
  );
});

// ---------------------------------------------------------------------------
// Handoff verification
// ---------------------------------------------------------------------------

test("a verified handoff marks the order paid, and replay is idempotent", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071840";
  const gatewayOrderId = "order_VERIFYOK0001";
  const paymentId = "pay_VERIFYOK0001";
  const order = await insertOnlineOrder(gatewayOrderId, customerId);
  registerPayment(paymentId, gatewayOrderId);

  const payload = {
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: checkoutSignature(gatewayOrderId, paymentId),
  };

  const first = await orders.verifyOnlineOrderPayment(order.orderId, payload, customerId);
  assert.equal(first.status, "paid");
  assert.equal(first.order.payment.method, "RAZORPAY");
  assert.equal(first.order.payment.status, "PAID");
  assert.ok(first.order.paidAt);

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.payment.status, "PAID");
  assert.equal(stored?.payment.gatewayPaymentId, paymentId);
  assert.equal(stored?.paymentStatus, "PAID");
  assert.ok(stored?.paidAt);
  const paidAt = stored?.paidAt?.toISOString();

  const fetchesBeforeReplay = paymentFetchCount;
  const second = await orders.verifyOnlineOrderPayment(order.orderId, payload, customerId);
  assert.equal(second.status, "paid");
  assert.equal(paymentFetchCount, fetchesBeforeReplay, "an already-paid order must not re-fetch the payment");

  const after = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(after?.paidAt?.toISOString(), paidAt, "paidAt must never be re-stamped");
});

test("a forged handoff signature is refused and leaves the order pending", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071841";
  const gatewayOrderId = "order_BADSIG0001";
  const paymentId = "pay_BADSIG0001";
  const order = await insertOnlineOrder(gatewayOrderId, customerId);
  registerPayment(paymentId, gatewayOrderId);

  await assert.rejects(
    () =>
      orders.verifyOnlineOrderPayment(
        order.orderId,
        {
          razorpay_order_id: gatewayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: checkoutSignature(gatewayOrderId, paymentId, "attacker-secret"),
        },
        customerId,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );

  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.payment.status, "PENDING");
  assert.equal(stored?.paidAt ?? null, null);
});

test("an amount mismatch is never accepted as payment", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071842";
  const gatewayOrderId = "order_AMOUNT0001";
  const paymentId = "pay_AMOUNT0001";
  const order = await insertOnlineOrder(gatewayOrderId, customerId);
  registerPayment(paymentId, gatewayOrderId, { amount: 1 });

  const result = await orders.verifyOnlineOrderPayment(
    order.orderId,
    {
      razorpay_order_id: gatewayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: checkoutSignature(gatewayOrderId, paymentId),
    },
    customerId,
  );

  assert.equal(result.status, "pending");
  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.payment.status, "PENDING");
});

test("a customer cannot confirm somebody else's order", async () => {
  const ownerId = "65f0c0a1b2c3d4e5f6071843";
  const strangerId = "65f0c0a1b2c3d4e5f6071844";
  const gatewayOrderId = "order_OWNER0001";
  const paymentId = "pay_OWNER0001";
  const order = await insertOnlineOrder(gatewayOrderId, ownerId);
  registerPayment(paymentId, gatewayOrderId);

  await assert.rejects(
    () =>
      orders.verifyOnlineOrderPayment(
        order.orderId,
        {
          razorpay_order_id: gatewayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: checkoutSignature(gatewayOrderId, paymentId),
        },
        strangerId,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 404,
  );
});

test("a handoff for a different gateway order is refused", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071845";
  const order = await insertOnlineOrder("order_MATCH0001", customerId);

  await assert.rejects(
    () =>
      orders.verifyOnlineOrderPayment(
        order.orderId,
        {
          razorpay_order_id: "order_OTHER0001",
          razorpay_payment_id: "pay_OTHER0001",
          razorpay_signature: "00",
        },
        customerId,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
  );
});

test("a payment reported against a different gateway order is refused", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071846";
  const gatewayOrderId = "order_FETCH0001";
  const paymentId = "pay_FETCH0001";
  const order = await insertOnlineOrder(gatewayOrderId, customerId);
  // The signature is valid for (gatewayOrderId, paymentId), but Razorpay reports
  // that this payment belongs to a different order.
  registerPayment(paymentId, "order_SOMEONEELSE");

  await assert.rejects(
    () =>
      orders.verifyOnlineOrderPayment(
        order.orderId,
        {
          razorpay_order_id: gatewayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: checkoutSignature(gatewayOrderId, paymentId),
        },
        customerId,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
  );
});

test("an online confirmation is refused for a COD order", async () => {
  const customerId = "65f0c0a1b2c3d4e5f6071847";
  orderCounter += 1;
  const order = await OrderModel.create({
    orderId: `MALMI-2026-RZP-COD-${String(orderCounter).padStart(4, "0")}`,
    customerId,
    items: [
      {
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        productSlug: "test-cold-pressed-oil",
        productName: "Test Cold Pressed Oil",
        variantSize: "1 L",
        productImage: "/test.jpg",
        unitPrice: UNIT_PRICE,
        unitMrp: 600,
        quantity: 1,
        itemTotal: UNIT_PRICE,
      },
    ],
    shippingAddress: address,
    subtotal: UNIT_PRICE,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: UNIT_PRICE,
    payment: { method: "COD", status: "PENDING" },
    paymentStatus: "PENDING",
    shipment: { provider: "MANUAL", status: "NOT_CREATED" },
    orderStatus: "PLACED",
    stockRestored: false,
  });

  await assert.rejects(
    () =>
      orders.verifyOnlineOrderPayment(
        order.orderId,
        { razorpay_order_id: "order_ANY0001", razorpay_payment_id: "pay_ANY0001", razorpay_signature: "00" },
        customerId,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
  );
});
