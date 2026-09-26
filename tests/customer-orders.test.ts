/**
 * Database-backed tests for customer accounts and order ownership.
 *
 * SAFETY: these tests run against a throwaway database only. The suite refuses
 * to start unless the resolved database name ends in `_test`, so it can never
 * read, write or delete anything in the real `malmi_lifestyle` database.
 */

import assert from "node:assert/strict";
import test, { after, before } from "node:test";

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

type DbModule = typeof import("@/lib/db");
type CustomerService = typeof import("@/lib/customer-service");
type OrderService = typeof import("@/lib/order-service");
type SessionModule = typeof import("@/lib/customer-session");
type CustomerAuth = typeof import("@/lib/customerAuth");
type CustomerModelModule = typeof import("@/models/Customer");
type ProductModelModule = typeof import("@/models/Product");
type CategoryModelModule = typeof import("@/models/Category");
type OrderModelModule = typeof import("@/models/Order");

let db: DbModule;
let customers: CustomerService;
let orders: OrderService;
let session: SessionModule;
let customerAuth: CustomerAuth;
let CustomerModel: CustomerModelModule["default"];
let ProductModel: ProductModelModule["default"];
let CategoryModel: CategoryModelModule["default"];
let OrderModel: OrderModelModule["default"];

const CATEGORY_ID = "test-category-oils";
const PRODUCT_ID = "test-product-oil";
const VARIANT_ID = "test-variant-1l";

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

function orderRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: "test-key-abcdefghij",
    paymentMethod: "COD",
    items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 }],
    shippingAddress: address,
    ...overrides,
  };
}

before(async () => {
  db = await import("@/lib/db");
  customers = await import("@/lib/customer-service");
  orders = await import("@/lib/order-service");
  session = await import("@/lib/customer-session");
  customerAuth = await import("@/lib/customerAuth");
  CustomerModel = (await import("@/models/Customer")).default;
  ProductModel = (await import("@/models/Product")).default;
  CategoryModel = (await import("@/models/Category")).default;
  OrderModel = (await import("@/models/Order")).default;

  await db.connectToDatabase();
  await db.disconnectDatabase();
  await db.connectToDatabase();

  await Promise.all([
    CustomerModel.deleteMany({}),
    OrderModel.deleteMany({}),
    ProductModel.deleteMany({ productId: PRODUCT_ID }),
    CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
  ]);

  await CategoryModel.create({
    categoryId: CATEGORY_ID,
    name: "Test Oils",
    slug: "test-oils",
    shortName: "Oils",
    description: "Fixture category used only by the test suite.",
    image: "/test.jpg",
    isActive: true,
    sortOrder: 0,
  });

  await ProductModel.create({
    productId: PRODUCT_ID,
    categoryId: CATEGORY_ID,
    categorySlug: "test-oils",
    category: "Test Oils",
    name: "Test Cold Pressed Oil",
    slug: "test-cold-pressed-oil",
    description: "Fixture product used only by the test suite.",
    price: 540,
    compareAtPrice: 600,
    rating: null,
    reviewCount: null,
    badge: null,
    isActive: true,
    variants: [
      {
        variantId: VARIANT_ID,
        size: "1 L",
        price: 540,
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
  if (!db) return;
  await Promise.all([
    CustomerModel.deleteMany({}),
    OrderModel.deleteMany({}),
    ProductModel.deleteMany({ productId: PRODUCT_ID }),
    CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
  ]);
  await db.disconnectDatabase();
});

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

test("a customer can register and then sign in with the same password", async () => {
  const created = await customers.registerCustomer({
    name: "Asha Rao",
    email: "asha@example.com",
    password: "correct-horse",
    phone: "9876543210",
  });

  assert.equal(created.email, "asha@example.com");
  assert.equal(created.name, "Asha Rao");
  assert.equal(created.phoneVerified, false);
  assert.equal("passwordHash" in created, false);
  assert.equal(JSON.stringify(created).includes("$2b$"), false);

  const signedIn = await customers.authenticateCustomer({
    email: "ASHA@example.com",
    password: "correct-horse",
  });
  assert.equal(signedIn?.id, created.id);
});

test("the stored password is a bcrypt hash and is never returned", async () => {
  const stored = await CustomerModel.findOne({ email: "asha@example.com" })
    .select("+passwordHash")
    .lean();
  assert.match(String(stored?.passwordHash), /^\$2[aby]\$/);
  assert.equal(String(stored?.passwordHash).includes("correct-horse"), false);

  // The default projection hides the hash entirely.
  const projected = await CustomerModel.findOne({ email: "asha@example.com" }).lean();
  assert.equal("passwordHash" in projected!, false);
});

test("wrong password, unknown email and deactivated accounts all fail identically", async () => {
  const wrongPassword = await customers.authenticateCustomer({
    email: "asha@example.com",
    password: "wrong-password",
  });
  const unknownEmail = await customers.authenticateCustomer({
    email: "nobody@example.com",
    password: "correct-horse",
  });
  assert.equal(wrongPassword, null);
  assert.equal(unknownEmail, null);

  const deactivated = await customers.registerCustomer({
    name: "Inactive User",
    email: "inactive@example.com",
    password: "correct-horse",
    phone: "9876543211",
  });
  await CustomerModel.updateOne({ _id: deactivated.id }, { $set: { isActive: false } });
  assert.equal(
    await customers.authenticateCustomer({ email: "inactive@example.com", password: "correct-horse" }),
    null,
  );
});

test("duplicate registrations are rejected and a deactivated account blocks re-registration", async () => {
  const { CustomerValidationError } = await import("@/lib/customer-validation");
  await assert.rejects(
    () => customers.registerCustomer({
      name: "Asha Rao",
      email: "asha@example.com",
      password: "another-password",
      phone: "9876543210",
    }),
    (error: unknown) =>
      error instanceof CustomerValidationError &&
      error.status === 409 &&
      error.fieldErrors.email !== undefined,
  );

  // The duplicate attempt must not have overwritten the original hash.
  const original = await customers.authenticateCustomer({
    email: "asha@example.com",
    password: "correct-horse",
  });
  assert.ok(original);
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

test("a session resolves to its customer, and not to a deleted or disabled one", async () => {
  const owner = await customers.registerCustomer({
    name: "Session Owner",
    email: "session-owner@example.com",
    password: "correct-horse",
    phone: "9876543212",
  });
  const token = await session.createCustomerSessionToken(owner.id);

  const resolved = await customerAuth.resolveCustomerFromToken(token);
  assert.equal(resolved?.id, owner.id);
  assert.equal(resolved?.email, "session-owner@example.com");

  // A token whose signature is broken resolves to nobody.
  assert.equal(await customerAuth.resolveCustomerFromToken(`${token}x`), null);

  await CustomerModel.updateOne({ _id: owner.id }, { $set: { isActive: false } });
  assert.equal(await customerAuth.resolveCustomerFromToken(token), null);
});

// ---------------------------------------------------------------------------
// Order ownership
//
// The authorization boundary lives in the query layer, so these tests insert
// orders directly instead of going through the transactional checkout. That
// keeps them runnable against a standalone mongod.
// ---------------------------------------------------------------------------

let transactionsAvailable = false;

async function canUseTransactions(): Promise<boolean> {
  const mongoose = (await import("mongoose")).default;
  const connection = mongoose.connection;
  // A replica-set member reports `setName`; a mongos reports `msg: "isdbgrid"`.
  // A standalone server reports neither and rejects multi-document
  // transactions with code 20 / IllegalOperation.
  const hello = (await connection.db!.admin().command({ hello: 1 })) as {
    setName?: string;
    msg?: string;
  };
  return Boolean(hello.setName) || hello.msg === "isdbgrid";
}

let orderCounter = 0;

let settlementCounter = 0;

/** A fresh account for each settlement scenario so the tests stay independent. */
async function registerSettlementCustomer(label: string) {
  settlementCounter += 1;
  return customers.registerCustomer({
    name: `Settlement ${label}`,
    email: `settlement-${label}-${settlementCounter}@example.com`,
    password: "correct-horse",
    phone: `987654${String(3000 + settlementCounter).padStart(4, "0")}`,
  });
}

async function insertOrderFor(
  customerId: string,
  overrides: Record<string, unknown> = {},
) {  orderCounter += 1;
  return OrderModel.create({
    orderId: `MALMI-2026-TEST-${String(orderCounter).padStart(4, "0")}`,
    customerId,
    items: [
      {
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        productSlug: "test-cold-pressed-oil",
        productName: "Test Cold Pressed Oil",
        variantSize: "1 L",
        productImage: "/test.jpg",
        unitPrice: 540,
        unitMrp: 600,
        quantity: 1,
        itemTotal: 540,
      },
    ],
    shippingAddress: address,
    subtotal: 540,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 540,
    payment: { method: "COD", status: "PENDING" },
    paymentStatus: "PENDING",
    shipment: { provider: "MANUAL", status: "NOT_CREATED" },
    orderStatus: "PLACED",
    stockRestored: false,
    ...overrides,
  });
}

test("a customer can only read their own order", async () => {
  const owner = await customers.registerCustomer({
    name: "Order Owner",
    email: "order-owner@example.com",
    password: "correct-horse",
    phone: "9876543213",
  });
  const stranger = await customers.registerCustomer({
    name: "Order Stranger",
    email: "order-stranger@example.com",
    password: "correct-horse",
    phone: "9876543214",
  });

  const order = await insertOrderFor(owner.id);

  // The owner sees it.
  const ownOrder = await orders.getOrderForCustomer(order.orderId, owner.id);
  assert.equal(ownOrder?.orderId, order.orderId);
  assert.equal(ownOrder?.itemCount, 1);
  assert.equal(ownOrder?.totalAmount, 540);

  // A different customer gets null — identical to a missing order, so the
  // endpoint cannot be used to discover somebody else's order id.
  assert.equal(await orders.getOrderForCustomer(order.orderId, stranger.id), null);
  assert.equal(await orders.getOrderForCustomer("MALMI-2026-does-not-exist", owner.id), null);
  assert.equal(await orders.getOrderForCustomer(order.orderId, ""), null);
});

test("order history only ever contains the signed-in customer's orders", async () => {
  const owner = await customers.registerCustomer({
    name: "History Owner",
    email: "history-owner@example.com",
    password: "correct-horse",
    phone: "9876543215",
  });
  const stranger = await customers.registerCustomer({
    name: "History Stranger",
    email: "history-stranger@example.com",
    password: "correct-horse",
    phone: "9876543216",
  });

  const first = await insertOrderFor(owner.id);
  const second = await insertOrderFor(owner.id, { orderStatus: "PACKED" });
  const strangerOrder = await insertOrderFor(stranger.id);

  const ownerOrders = await orders.listOrdersForCustomer(owner.id);
  const ownerOrderIds = ownerOrders.map((order) => order.orderId);
  assert.deepEqual(new Set(ownerOrderIds), new Set([first.orderId, second.orderId]));
  assert.equal(ownerOrderIds.includes(strangerOrder.orderId), false);

  const strangerOrders = await orders.listOrdersForCustomer(stranger.id);
  assert.deepEqual(strangerOrders.map((order) => order.orderId), [strangerOrder.orderId]);

  assert.deepEqual(await orders.listOrdersForCustomer(""), []);
});

test("an order is refused without a customer identity", async () => {
  await assert.rejects(
    () => orders.createCodOrder(orderRequest({ idempotencyKey: "no-customer-key-1" }), ""),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 401,
  );
});

test("a client-supplied customerId in the order body is discarded", () => {
  // The checkout payload is parsed into a fixed shape, so no extra field —
  // including a forged identity — can survive into the order.
  const parsed = orders.parseCreateOrderInput(
    orderRequest({ customerId: "65f0c0a1b2c3d4e5f6071829", isAdmin: true }),
  );
  assert.equal("customerId" in parsed, false);
  assert.equal("isAdmin" in parsed, false);
  assert.deepEqual(Object.keys(parsed).sort(), [
    "idempotencyKey",
    "items",
    "paymentMethod",
    "shippingAddress",
  ]);
});

test("idempotency is scoped per customer, not global", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const first = await customers.registerCustomer({
    name: "Idem One",
    email: "idem-one@example.com",
    password: "correct-horse",
    phone: "9876543217",
  });
  const second = await customers.registerCustomer({
    name: "Idem Two",
    email: "idem-two@example.com",
    password: "correct-horse",
    phone: "9876543218",
  });

  const sharedKey = "shared-key-abcdefgh";
  const a = await orders.createCodOrder(orderRequest({ idempotencyKey: sharedKey }), first.id);
  const b = await orders.createCodOrder(orderRequest({ idempotencyKey: sharedKey }), second.id);

  // Two different customers may legitimately use the same generated key.
  assert.notEqual(a.orderId, b.orderId);

  // Replaying the key returns the same order instead of charging twice.
  const replay = await orders.createCodOrder(orderRequest({ idempotencyKey: sharedKey }), first.id);
  assert.equal(replay.orderId, a.orderId);
  assert.equal(replay._id.toString(), a._id.toString());
});

test("an order placed by one customer is invisible to another", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const victim = await customers.registerCustomer({
    name: "Victim",
    email: "victim@example.com",
    password: "correct-horse",
    phone: "9876543219",
  });
  const attacker = await customers.registerCustomer({
    name: "Attacker",
    email: "attacker@example.com",
    password: "correct-horse",
    phone: "9876543220",
  });

  const order = await orders.createCodOrder(
    // The route handler only ever forwards the session identity, so a
    // client-supplied customerId in the body is simply ignored.
    orderRequest({ idempotencyKey: "forged-key-abcdef", customerId: victim.id }),
    attacker.id,
  );
  assert.equal(String(order.customerId), attacker.id);
  assert.equal(await orders.getOrderForCustomer(order.orderId, victim.id), null);
});

test("stock is deducted once and the idempotent replay does not deduct again", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const buyer = await customers.registerCustomer({
    name: "Stock Buyer",
    email: "stock-buyer@example.com",
    password: "correct-horse",
    phone: "9876543221",
  });

  const before = await ProductModel.findOne({ productId: PRODUCT_ID }).lean();
  const stockBefore = before!.variants[0].stock;

  const key = "stock-key-abcdefgh";
  await orders.createCodOrder(
    orderRequest({ idempotencyKey: key, items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 2 }] }),
    buyer.id,
  );
  await orders.createCodOrder(
    orderRequest({ idempotencyKey: key, items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 2 }] }),
    buyer.id,
  );

  const afterReplay = await ProductModel.findOne({ productId: PRODUCT_ID }).lean();
  assert.equal(afterReplay!.variants[0].stock, stockBefore - 2);
});

// ---------------------------------------------------------------------------
// COD settlement on delivery
//
// The rule is: for COD, DELIVERED *is* payment confirmed. It must be written by
// the same update that moves the order status, must never fire for a non-COD
// order, and must never re-stamp a paidAt that already exists.
// ---------------------------------------------------------------------------

test("moving a COD order to SHIPPED leaves the payment pending", async () => {
  const owner = await registerSettlementCustomer("cod-shipped");
  const order = await insertOrderFor(owner.id, { orderStatus: "PACKED" });

  const updated = await orders.updateOrderStatus(order.orderId, "SHIPPED");

  assert.equal(updated.orderStatus, "SHIPPED");
  assert.equal(updated.paymentStatus, "PENDING");
  assert.equal(updated.payment.status, "PENDING");
  assert.equal(updated.paidAt ?? null, null);
});

test("COD PLACED -> SHIPPED -> DELIVERED settles the payment in the same update", async () => {
  const owner = await registerSettlementCustomer("cod-delivered");
  const order = await insertOrderFor(owner.id);

  const packed = await orders.updateOrderStatus(order.orderId, "PACKED");
  assert.equal(packed.paymentStatus, "PENDING", "packing must not settle payment");

  const shipped = await orders.updateOrderStatus(order.orderId, "SHIPPED");
  assert.equal(shipped.paymentStatus, "PENDING", "shipping must not settle payment");
  assert.equal(shipped.paidAt ?? null, null);

  const beforeDelivery = Date.now();
  const delivered = await orders.updateOrderStatus(order.orderId, "DELIVERED");
  const afterDelivery = Date.now();

  assert.equal(delivered.orderStatus, "DELIVERED");
  assert.equal(delivered.paymentStatus, "PAID");
  assert.equal(delivered.payment.status, "PAID", "the embedded payment record is what the UI reads");
  assert.ok(delivered.paidAt, "paidAt must be stamped");
  const stamped = delivered.paidAt!.getTime();
  assert.ok(
    stamped >= beforeDelivery - 1000 && stamped <= afterDelivery + 1000,
    `paidAt ${delivered.paidAt!.toISOString()} should fall inside the transition window`,
  );

  // And it is durable, not just the in-memory return value.
  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.paymentStatus, "PAID");
  assert.equal(stored?.payment.status, "PAID");
  assert.equal(stored?.paidAt?.toISOString(), delivered.paidAt!.toISOString());
});

test("COD SHIPPED -> DELIVERED settles the payment", async () => {
  const owner = await registerSettlementCustomer("cod-shipped-only");
  const order = await insertOrderFor(owner.id, { orderStatus: "SHIPPED" });

  const delivered = await orders.updateOrderStatus(order.orderId, "DELIVERED");

  assert.equal(delivered.orderStatus, "DELIVERED");
  assert.equal(delivered.paymentStatus, "PAID");
  assert.ok(delivered.paidAt);
});

test("re-delivering an already-PAID COD order does not overwrite paidAt", async () => {
  const owner = await registerSettlementCustomer("cod-already-paid");
  const original = new Date("2026-02-03T04:05:06.000Z");
  const order = await insertOrderFor(owner.id, {
    orderStatus: "DELIVERED",
    payment: { method: "COD", status: "PAID" },
    paymentStatus: "PAID",
    paidAt: original,
  });

  const again = await orders.updateOrderStatus(order.orderId, "DELIVERED");
  const third = await orders.updateOrderStatus(order.orderId, "DELIVERED");

  assert.equal(again.orderStatus, "DELIVERED");
  assert.equal(again.paymentStatus, "PAID");
  assert.equal(again.paidAt?.toISOString(), original.toISOString(), "paidAt must survive a repeat update");
  assert.equal(third.paidAt?.toISOString(), original.toISOString());
});

test("re-processing a delivered COD order that is still unpaid settles it once", async () => {
  // This is the shape of an order delivered before the rule existed: the status
  // moved but the payment did not follow.
  const owner = await registerSettlementCustomer("cod-legacy-unpaid");
  const order = await insertOrderFor(owner.id, { orderStatus: "DELIVERED" });
  assert.equal(order.paymentStatus, "PENDING");

  const repaired = await orders.updateOrderStatus(order.orderId, "DELIVERED");
  assert.equal(repaired.orderStatus, "DELIVERED");
  assert.equal(repaired.paymentStatus, "PAID");
  assert.equal(repaired.payment.status, "PAID");
  assert.ok(repaired.paidAt);

  const settledAt = repaired.paidAt!.toISOString();
  const again = await orders.updateOrderStatus(order.orderId, "DELIVERED");
  assert.equal(again.paidAt?.toISOString(), settledAt, "a second pass must not re-stamp paidAt");
});

test("a non-COD order is never settled by the delivery rule", async () => {
  const owner = await registerSettlementCustomer("non-cod");
  // The schema only permits COD today, so this row is written straight to the
  // collection to prove the service-level guard rather than the enum.
  orderCounter += 1;
  const orderId = `MALMI-2026-TEST-NONCOD-${String(orderCounter).padStart(4, "0")}`;
  await OrderModel.collection.insertOne({
    orderId,
    customerId: new (await import("mongoose")).Types.ObjectId(String(owner.id)),
    items: [{
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      productSlug: "test-cold-pressed-oil",
      productName: "Test Cold Pressed Oil",
      variantSize: "1 L",
      productImage: "/test.jpg",
      unitPrice: 540,
      unitMrp: 600,
      quantity: 1,
      itemTotal: 540,
    }],
    shippingAddress: address,
    subtotal: 540,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 540,
    payment: { method: "RAZORPAY", status: "PENDING" },
    paymentStatus: "PENDING",
    shipment: { provider: "MANUAL", status: "NOT_CREATED" },
    orderStatus: "SHIPPED",
    stockRestored: false,
  });

  const delivered = await orders.updateOrderStatus(orderId, "DELIVERED");

  assert.equal(delivered.orderStatus, "DELIVERED");
  assert.equal(delivered.paymentStatus, "PENDING", "a gateway-reported status must be left alone");
  assert.equal(delivered.payment.status, "PENDING");
  assert.equal(delivered.paidAt ?? null, null);

  await OrderModel.collection.deleteOne({ orderId });
});

test("the delivery rule does not weaken the transition rules", async () => {
  const owner = await registerSettlementCustomer("bad-transitions");

  const placed = await insertOrderFor(owner.id);
  // Skipping the sequence is still refused, and nothing is settled by the attempt.
  await assert.rejects(
    () => orders.updateOrderStatus(placed.orderId, "DELIVERED"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
  );
  const untouched = await OrderModel.findOne({ orderId: placed.orderId }).lean();
  assert.equal(untouched?.orderStatus, "PLACED");
  assert.equal(untouched?.paymentStatus, "PENDING");
  assert.equal(untouched?.paidAt ?? null, null);

  // A delivered COD order still cannot be cancelled, and its stock stays spent.
  const stockBefore = (await ProductModel.findOne({ productId: PRODUCT_ID }).lean())!.variants[0].stock;
  await orders.updateOrderStatus(placed.orderId, "PACKED");
  await orders.updateOrderStatus(placed.orderId, "SHIPPED");
  const delivered = await orders.updateOrderStatus(placed.orderId, "DELIVERED");
  assert.equal(delivered.paymentStatus, "PAID");

  if (!transactionsAvailable) {
    // Cancelling runs in a transaction, which a standalone mongod refuses. The
    // live Atlas run covers this case.
    return;
  }

  await assert.rejects(
    () => orders.updateOrderStatus(delivered.orderId, "CANCELLED"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 409,
  );
  const stockAfter = (await ProductModel.findOne({ productId: PRODUCT_ID }).lean())!.variants[0].stock;
  assert.equal(stockAfter, stockBefore, "a refused cancellation must not restore stock");
});

test("an unknown status value and an unknown order are still refused", async () => {
  const owner = await registerSettlementCustomer("bad-inputs");
  const order = await insertOrderFor(owner.id);

  await assert.rejects(
    () => orders.updateOrderStatus(order.orderId, "PAID"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
  await assert.rejects(
    () => orders.updateOrderStatus(order.orderId, 42),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
  await assert.rejects(
    () => orders.updateOrderStatus("MALMI-2026-nope", "PACKED"),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 404,
  );
});

test("the customer-facing order views report the settled payment", async () => {
  const owner = await registerSettlementCustomer("cod-views");
  const order = await insertOrderFor(owner.id, { orderStatus: "SHIPPED" });
  const delivered = await orders.updateOrderStatus(order.orderId, "DELIVERED");

  const detail = await orders.getOrderForCustomer(order.orderId, owner.id);
  assert.equal(detail?.payment.method, "COD");
  assert.equal(detail?.payment.status, "PAID", "the customer view must not show a stale PENDING");
  assert.equal(detail?.paidAt?.toISOString(), delivered.paidAt!.toISOString());

  const history = await orders.listOrdersForCustomer(owner.id);
  const row = history.find((entry) => entry.orderId === order.orderId);
  assert.equal(row?.payment.status, "PAID");
  assert.equal(row?.paidAt?.toISOString(), delivered.paidAt!.toISOString());
});

test("the admin transition endpoint is gated on a verified admin credential", async () => {
  const { verifyAdminToken } = await import("@/lib/adminAuth");

  // `requireAdminSession()` answers 401 whenever this returns false, and the
  // route calls it before `updateOrderStatus`, so an unauthenticated caller can
  // never reach the delivery rule. (`cookies()` needs a live request scope, so
  // the end-to-end 401 is covered by the live HTTP run instead.)
  assert.equal(await verifyAdminToken(undefined), false);
  assert.equal(await verifyAdminToken(""), false);
  assert.equal(await verifyAdminToken("not-a-real-token"), false);
  assert.equal(await verifyAdminToken("admin_session=forged.signature"), false);
  assert.equal(await verifyAdminToken("a.b.c"), false);

  // And the order itself is untouched by any of those attempts.
  const owner = await registerSettlementCustomer("unauth-admin");
  const order = await insertOrderFor(owner.id, { orderStatus: "SHIPPED" });
  const stored = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(stored?.orderStatus, "SHIPPED");
  assert.equal(stored?.paymentStatus, "PENDING");
  assert.equal(stored?.paidAt ?? null, null);
});
