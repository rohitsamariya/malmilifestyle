import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { codSettlementOnDelivery } from "@/lib/payments/cod";
import { verifyRazorpayCheckoutSignature } from "@/lib/payments/razorpay";
import {
  canCancelOrder,
  nextFulfillmentStatus,
  OrderServiceError,
  parseCreateOrderInput,
  parseVerifyPaymentInput,
  shouldRestoreOrderStock,
  stockDeductionFilter,
  validateCatalogSelection,
} from "@/lib/order-service";

const validRequest = {
  idempotencyKey: "checkout-key-123456",
  paymentMethod: "COD",
  items: [{ productId: "product-1", variantId: "variant-1", quantity: 2 }],
  shippingAddress: {
    fullName: "Test Customer",
    phone: "9876543210",
    email: "customer@example.com",
    addressLine1: "12 Test Road",
    addressLine2: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  },
};

const product = {
  productId: "product-1",
  name: "Test product",
  slug: "test-product",
  isActive: true,
  variants: [{
    variantId: "variant-1",
    size: "1 L",
    price: 540,
    compareAtPrice: 600,
    stock: 3,
    isActive: true,
    image: "/test.jpg",
  }],
};

function assertServiceError(action: () => unknown, status: number) {
  assert.throws(action, (error: unknown) => error instanceof OrderServiceError && error.status === status);
}

test("accepts COD and only returns customer-entered fields and catalog identifiers", () => {
  const input = parseCreateOrderInput({
    ...validRequest,
    total: 1,
    subtotal: 1,
    items: [{
      ...validRequest.items[0],
      productName: "Forged name",
      price: 1,
      mrp: 0,
      stock: 100000,
      itemTotal: 1,
    }],
  });
  assert.deepEqual(input.items, [{ productId: "product-1", variantId: "variant-1", quantity: 2 }]);
  assert.equal(input.paymentMethod, "COD");
  assert.equal("total" in input, false);
});

test("rejects invalid product lookup and missing variants", () => {
  assertServiceError(() => validateCatalogSelection(null, null, "variant-1", 1), 404);
  assertServiceError(() => validateCatalogSelection(product, { isActive: true }, "missing", 1), 404);
});

test("accepts COD and Razorpay and rejects any other payment method", () => {
  assert.equal(parseCreateOrderInput({ ...validRequest, paymentMethod: "COD" }).paymentMethod, "COD");
  assert.equal(parseCreateOrderInput({ ...validRequest, paymentMethod: "RAZORPAY" }).paymentMethod, "RAZORPAY");
  assertServiceError(() => parseCreateOrderInput({ ...validRequest, paymentMethod: "UPI" }), 400);
  assertServiceError(() => parseCreateOrderInput({ ...validRequest, paymentMethod: "card" }), 400);
  assertServiceError(() => parseCreateOrderInput({ ...validRequest, paymentMethod: "" }), 400);
});

test("rejects inactive products, inactive categories, and inactive variants", () => {
  assertServiceError(() => validateCatalogSelection({ ...product, isActive: false }, { isActive: true }, "variant-1", 1), 409);
  assertServiceError(() => validateCatalogSelection(product, null, "variant-1", 1), 409);
  assertServiceError(() => validateCatalogSelection(product, { isActive: false }, "variant-1", 1), 409);
  assertServiceError(() => validateCatalogSelection({
    ...product,
    variants: [{ ...product.variants[0], isActive: false }],
  }, { isActive: true }, "variant-1", 1), 409);
});

test("rejects zero, negative, fractional, and over-stock quantities", () => {
  for (const quantity of [0, -1, 1.5]) {
    assertServiceError(() => parseCreateOrderInput({
      ...validRequest,
      items: [{ ...validRequest.items[0], quantity }],
    }), 400);
  }
  assertServiceError(() => validateCatalogSelection(product, { isActive: true }, "variant-1", 4), 409);
});

test("uses current database price and MRP for order pricing snapshots", () => {
  const current = validateCatalogSelection(product, { isActive: true }, "variant-1", 2);
  assert.equal(current.price * 2, 1080);
  assert.equal(current.compareAtPrice, 600);
});

test("stock deduction is conditional and cannot decrement below available stock", () => {
  assert.deepEqual(stockDeductionFilter("product-1", "variant-1", 2), {
    productId: "product-1",
    isActive: true,
    variants: {
      $elemMatch: {
        variantId: "variant-1",
        isActive: true,
        stock: { $gte: 2 },
      },
    },
  });
});

test("cancellation only restores before shipping and is one-time", () => {
  assert.equal(canCancelOrder("PLACED"), true);
  assert.equal(canCancelOrder("PACKED"), true);
  assert.equal(canCancelOrder("SHIPPED"), false);
  assert.equal(canCancelOrder("DELIVERED"), false);
  assert.equal(shouldRestoreOrderStock("PLACED", false), true);
  assert.equal(shouldRestoreOrderStock("PLACED", undefined), true);
  assert.equal(shouldRestoreOrderStock("CANCELLED", false), false);
  assert.equal(shouldRestoreOrderStock("PLACED", true), false);
});

test("admin fulfillment advances only through the required sequence", () => {
  assert.equal(nextFulfillmentStatus("PLACED"), "PACKED");
  assert.equal(nextFulfillmentStatus("PACKED"), "SHIPPED");
  assert.equal(nextFulfillmentStatus("SHIPPED"), "DELIVERED");
  assert.equal(nextFulfillmentStatus("DELIVERED"), null);
  assert.equal(nextFulfillmentStatus("CANCELLED"), null);
});

// ── COD delivery settles the payment ──────────────────────────────────────

const now = new Date("2026-09-26T10:00:00.000Z");

test("a COD order becomes PAID with a paidAt stamp when it is delivered", () => {
  assert.deepEqual(codSettlementOnDelivery({ method: "COD", status: "PENDING" }, now), {
    status: "PAID",
    paidAt: now,
  });
});

test("a non-COD order is never settled by the delivery rule", () => {
  for (const method of ["RAZORPAY", "ONLINE", "CARD", "NETBANKING", "UPI", ""]) {
    assert.equal(codSettlementOnDelivery({ method, status: "PENDING" }, now), null, method);
  }
  assert.equal(codSettlementOnDelivery(null, now), null);
  assert.equal(codSettlementOnDelivery(undefined, now), null);
});

test("an already-PAID COD order produces no new settlement, so paidAt is never re-stamped", () => {
  const earlier = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(codSettlementOnDelivery({ method: "COD", status: "PAID", paidAt: earlier }, now), null);
  assert.equal(codSettlementOnDelivery({ method: "COD", status: "PAID" }, now), null);
});

test("an unsettled COD order that already has a timestamp keeps it", () => {
  const earlier = new Date("2026-01-01T00:00:00.000Z");
  assert.deepEqual(codSettlementOnDelivery({ method: "COD", status: "FAILED", paidAt: earlier }, now), {
    status: "PAID",
    paidAt: earlier,
  });
});

// ── Razorpay Checkout handoff verification ────────────────────────────────

const CHECKOUT_SECRET = "test-checkout-key-secret";

function checkoutSignature(orderId: string, paymentId: string, secret = CHECKOUT_SECRET) {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`, "utf8").digest("hex");
}

test("a checkout handoff signature is verified against the key secret", () => {
  const orderId = "order_TEST0000000001";
  const paymentId = "pay_TEST0000000001";
  const signature = checkoutSignature(orderId, paymentId);

  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature }, CHECKOUT_SECRET), true);
  // Signature computed for a different payment must not verify.
  assert.equal(
    verifyRazorpayCheckoutSignature({ orderId, paymentId, signature: checkoutSignature(orderId, "pay_OTHER0000001") }, CHECKOUT_SECRET),
    false,
  );
  // Wrong secret, missing pieces and non-hex values are all refused.
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature }, "wrong-secret"), false);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature: "" }, CHECKOUT_SECRET), false);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature: "not-hex" }, CHECKOUT_SECRET), false);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId: "", paymentId, signature }, CHECKOUT_SECRET), false);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature: null }, CHECKOUT_SECRET), false);
});

test("payment confirmation input requires well-formed references", () => {
  const parsed = parseVerifyPaymentInput({
    razorpay_order_id: "order_ABC123",
    razorpay_payment_id: "pay_XYZ789",
    razorpay_signature: "deadbeef",
  });
  assert.deepEqual(parsed, {
    razorpayOrderId: "order_ABC123",
    razorpayPaymentId: "pay_XYZ789",
    razorpaySignature: "deadbeef",
  });

  // camelCase is tolerated too.
  assert.equal(
    parseVerifyPaymentInput({ razorpayOrderId: "order_ABC123", razorpayPaymentId: "pay_XYZ789", razorpaySignature: "00ff" })
      .razorpayOrderId,
    "order_ABC123",
  );

  assertServiceError(() => parseVerifyPaymentInput({ razorpay_order_id: "nope", razorpay_payment_id: "pay_XYZ789", razorpay_signature: "deadbeef" }), 400);
  assertServiceError(() => parseVerifyPaymentInput({ razorpay_order_id: "order_ABC123", razorpay_payment_id: "nope", razorpay_signature: "deadbeef" }), 400);
  assertServiceError(() => parseVerifyPaymentInput({ razorpay_order_id: "order_ABC123", razorpay_payment_id: "pay_XYZ789", razorpay_signature: "zzzz" }), 400);
  assertServiceError(() => parseVerifyPaymentInput({ razorpay_order_id: "order_ABC123" }), 400);
  assertServiceError(() => parseVerifyPaymentInput(null), 400);
});
