/**
 * Database-backed tests for saved shipping addresses: CRUD, ownership, the
 * default-address invariant, input validation, and the checkout snapshot.
 *
 * SAFETY: these tests run against a throwaway database only. The suite refuses
 * to start unless the resolved database name ends in `_test`.
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
type AddressService = typeof import("@/lib/address-service");
type AddressValidation = typeof import("@/lib/address-validation");
type CustomerModelModule = typeof import("@/models/Customer");
type ProductModelModule = typeof import("@/models/Product");
type CategoryModelModule = typeof import("@/models/Category");
type OrderModelModule = typeof import("@/models/Order");

let db: DbModule;
let customers: CustomerService;
let orders: OrderService;
let addresses: AddressService;
let addressValidation: AddressValidation;
let CustomerModel: CustomerModelModule["default"];
let ProductModel: ProductModelModule["default"];
let CategoryModel: CategoryModelModule["default"];
let OrderModel: OrderModelModule["default"];

const CATEGORY_ID = "test-category-addresses";
const PRODUCT_ID = "test-product-addresses";
const VARIANT_ID = "test-variant-addresses";
const UNIT_PRICE = 540;

let orderCounter = 0;
let accountCounter = 0;
let transactionsAvailable = false;

const legacyAddress = {
  fullName: "Asha Rao",
  phone: "9876543210",
  email: "asha@example.com",
  addressLine1: "12 Test Road",
  addressLine2: "",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
};

function addressPayload(overrides: Record<string, unknown> = {}) {
  return {
    label: "Home",
    fullName: "Saved Buyer",
    phone: "9876500001",
    house: "9 Saved Street",
    building: "Tower B",
    locality: "Koregaon Park",
    landmark: "Near Park",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    country: "India",
    ...overrides,
  };
}

async function registerCustomer(label: string) {
  accountCounter += 1;
  return customers.registerCustomer({
    name: `${label} Buyer`,
    email: `${label}-address-${accountCounter}@example.com`,
    password: "correct-horse",
    phone: `98765${String(10000 + accountCounter).slice(-5)}`,
  });
}

function orderRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: "test-address-key-abcdefgh",
    paymentMethod: "COD",
    items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 }],
    shippingAddress: legacyAddress,
    ...overrides,
  };
}

async function canUseTransactions(): Promise<boolean> {
  const mongoose = (await import("mongoose")).default;
  const hello = (await mongoose.connection.db!.admin().command({ hello: 1 })) as {
    setName?: string;
    msg?: string;
  };
  return Boolean(hello.setName) || hello.msg === "isdbgrid";
}

before(async () => {
  db = await import("@/lib/db");
  customers = await import("@/lib/customer-service");
  orders = await import("@/lib/order-service");
  addresses = await import("@/lib/address-service");
  addressValidation = await import("@/lib/address-validation");
  CustomerModel = (await import("@/models/Customer")).default;
  ProductModel = (await import("@/models/Product")).default;
  CategoryModel = (await import("@/models/Category")).default;
  OrderModel = (await import("@/models/Order")).default;

  await db.connectToDatabase();
  await Promise.all([
    CustomerModel.deleteMany({}),
    OrderModel.deleteMany({}),
    ProductModel.deleteMany({ productId: PRODUCT_ID }),
    CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
  ]);

  await CategoryModel.create({
    categoryId: CATEGORY_ID,
    name: "Test Addresses",
    slug: "test-addresses",
    shortName: "Addresses",
    description: "Fixture category used only by the test suite.",
    image: "/test.jpg",
    isActive: true,
    sortOrder: 0,
  });

  await ProductModel.create({
    productId: PRODUCT_ID,
    categoryId: CATEGORY_ID,
    categorySlug: "test-addresses",
    category: "Test Addresses",
    name: "Test Cold Pressed Oil",
    slug: "test-addresses-oil",
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
        stock: 100,
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
      CustomerModel.deleteMany({}),
      OrderModel.deleteMany({}),
      ProductModel.deleteMany({ productId: PRODUCT_ID }),
      CategoryModel.deleteMany({ categoryId: CATEGORY_ID }),
    ]);
    await db.disconnectDatabase();
  }
});

// ---------------------------------------------------------------------------
// Pure validation (no database)
// ---------------------------------------------------------------------------

test("a valid address is normalized and defaults are applied", () => {
  const parsed = addressValidation.parseNewAddressInput({
    fullName: "  Asha   Rao ",
    phone: "+91 98765 00001",
    house: "9 Saved Street",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  });

  assert.equal(parsed.fullName, "Asha Rao");
  assert.equal(parsed.phone, "9876500001");
  assert.equal(parsed.label, "Home");
  assert.equal(parsed.country, "India");
  assert.equal(parsed.isDefault, false);
});

test("required address fields are reported with field errors", () => {
  assert.throws(
    () => addressValidation.parseNewAddressInput({ fullName: "", phone: "abc", house: "", city: "", state: "", pincode: "12" }),
    (error: unknown) => {
      const e = error as { status: number; fieldErrors: Record<string, string> };
      assert.equal(e.status, 400);
      assert.ok(e.fieldErrors.fullName);
      assert.ok(e.fieldErrors.phone);
      assert.ok(e.fieldErrors.house);
      assert.ok(e.fieldErrors.city);
      assert.ok(e.fieldErrors.state);
      assert.ok(e.fieldErrors.pincode);
      return true;
    },
  );
});

test("an update may be partial and an empty update is rejected", () => {
  const update = addressValidation.parseAddressUpdateInput({ city: "Mumbai" });
  assert.deepEqual(update, { city: "Mumbai" });

  assert.throws(
    () => addressValidation.parseAddressUpdateInput({}),
    (error: unknown) => (error as { status: number }).status === 400,
  );
});

// ---------------------------------------------------------------------------
// Service CRUD
// ---------------------------------------------------------------------------

test("the first saved address becomes the default", async () => {
  const owner = await registerCustomer("first");
  const created = await addresses.createCustomerAddress(owner.id, addressPayload());

  assert.equal(created.addresses.length, 1);
  assert.equal(created.addresses[0].id, created.createdId);
  assert.equal(created.addresses[0].isDefault, true);
  assert.equal(created.addresses[0].fullName, "Saved Buyer");
});

test("setting a default clears the previous one and only one remains", async () => {
  const owner = await registerCustomer("defaults");
  const first = await addresses.createCustomerAddress(owner.id, addressPayload({ label: "Home" }));
  const second = await addresses.createCustomerAddress(owner.id, addressPayload({ label: "Office" }));

  assert.equal(second.addresses.filter((a) => a.isDefault).length, 1);
  assert.equal(second.addresses.find((a) => a.id === first.createdId)?.isDefault, true);

  const updated = await addresses.setDefaultCustomerAddress(owner.id, second.createdId);
  assert.equal(updated.filter((a) => a.isDefault).length, 1);
  assert.equal(updated.find((a) => a.id === second.createdId)?.isDefault, true);
});

test("editing an address persists the supplied fields only", async () => {
  const owner = await registerCustomer("edit");
  const created = await addresses.createCustomerAddress(owner.id, addressPayload());
  const updated = await addresses.updateCustomerAddress(owner.id, created.createdId, {
    city: "Mumbai",
    building: "Tower C",
  });

  const address = updated.find((a) => a.id === created.createdId)!;
  assert.equal(address.city, "Mumbai");
  assert.equal(address.building, "Tower C");
  assert.equal(address.fullName, "Saved Buyer");
});

test("deleting the default promotes the next address", async () => {
  const owner = await registerCustomer("promote");
  const first = await addresses.createCustomerAddress(owner.id, addressPayload({ label: "Home" }));
  const second = await addresses.createCustomerAddress(owner.id, addressPayload({ label: "Office" }));

  const remaining = await addresses.deleteCustomerAddress(owner.id, first.createdId);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, second.createdId);
  assert.equal(remaining[0].isDefault, true);
});

test("a customer cannot touch another customer's address", async () => {
  const owner = await registerCustomer("owner");
  const stranger = await registerCustomer("stranger");
  const created = await addresses.createCustomerAddress(owner.id, addressPayload());

  await assert.rejects(
    () => addresses.updateCustomerAddress(stranger.id, created.createdId, { city: "X" }),
    (error: unknown) => (error as { status: number }).status === 404,
  );
  await assert.rejects(
    () => addresses.deleteCustomerAddress(stranger.id, created.createdId),
    (error: unknown) => (error as { status: number }).status === 404,
  );
  await assert.rejects(
    () => addresses.setDefaultCustomerAddress(stranger.id, created.createdId),
    (error: unknown) => (error as { status: number }).status === 404,
  );

  assert.deepEqual(await addresses.listCustomerAddresses(stranger.id), []);
  assert.equal((await addresses.listCustomerAddresses(owner.id)).length, 1);
});

test("the address book refuses more than the maximum", async () => {
  const owner = await registerCustomer("max");
  for (let index = 0; index < 10; index += 1) {
    await addresses.createCustomerAddress(owner.id, addressPayload({ label: "Home" }));
  }

  await assert.rejects(
    () => addresses.createCustomerAddress(owner.id, addressPayload({ label: "Home" })),
    (error: unknown) => (error as { status: number }).status === 409,
  );
});

// ---------------------------------------------------------------------------
// Resolving an address for an order
// ---------------------------------------------------------------------------

test("resolveShippingAddress returns an owned snapshot and nothing for a stranger", async () => {
  const owner = await registerCustomer("resolve");
  const stranger = await registerCustomer("resolve-other");
  const created = await addresses.createCustomerAddress(owner.id, addressPayload());

  const snapshot = await addresses.resolveShippingAddress(owner.id, created.createdId);
  assert.ok(snapshot);
  assert.equal(snapshot.fullName, "Saved Buyer");
  assert.equal(snapshot.addressLine1, "9 Saved Street, Tower B");
  assert.equal(snapshot.addressLine2, "Koregaon Park, Near Park");
  assert.equal(snapshot.email, owner.email);
  assert.equal(snapshot.country, "India");

  assert.equal(await addresses.resolveShippingAddress(stranger.id, created.createdId), null);
  assert.equal(await addresses.resolveShippingAddress(owner.id, "not-a-valid-id"), null);
});

test("parseCreateOrderInput accepts exactly one address reference", () => {
  const withSaved = orders.parseCreateOrderInput(orderRequest({ shippingAddress: undefined, shippingAddressId: "a".repeat(24) }));
  assert.equal(withSaved.shippingAddressId, "a".repeat(24));
  assert.equal(withSaved.shippingAddress, undefined);

  const legacy = orders.parseCreateOrderInput(orderRequest());
  assert.equal(legacy.shippingAddressId, undefined);
  assert.equal(legacy.shippingAddress?.fullName, "Asha Rao");

  assert.throws(
    () => orders.parseCreateOrderInput(orderRequest({ shippingAddressId: "not-an-object-id" })),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
  assert.throws(
    () => orders.parseCreateOrderInput(orderRequest({ shippingAddressId: "a".repeat(24), shippingAddress: legacyAddress })),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 400,
  );
});

// ---------------------------------------------------------------------------
// Checkout snapshot (needs transactions)
// ---------------------------------------------------------------------------

test("a COD order snapshots a saved address and later edits cannot change it", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const owner = await registerCustomer("snapshot");
  const created = await addresses.createCustomerAddress(
    owner.id,
    addressPayload({ fullName: "Snapshot Buyer", phone: "9876500010" }),
  );

  orderCounter += 1;
  const order = await orders.createCodOrder(
    orderRequest({
      idempotencyKey: `saved-address-cod-key-${orderCounter}`,
      shippingAddress: undefined,
      shippingAddressId: created.createdId,
    }),
    owner.id,
  );

  assert.equal(order.shippingAddress.fullName, "Snapshot Buyer");
  assert.equal(order.shippingAddress.phone, "9876500010");
  assert.equal(order.shippingAddress.addressLine1, "9 Saved Street, Tower B");
  assert.equal(order.shippingAddress.addressLine2, "Koregaon Park, Near Park");
  assert.equal(order.shippingAddress.city, "Pune");
  assert.equal(order.shippingAddress.label, "Home");
  assert.equal(order.shippingAddress.country, "India");
  assert.equal(order.shippingAddress.email, owner.email);

  // Editing the saved address must not rewrite the placed order.
  await addresses.updateCustomerAddress(owner.id, created.createdId, {
    fullName: "Changed Name",
    house: "1 New Road",
  });
  const afterEdit = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(afterEdit?.shippingAddress.fullName, "Snapshot Buyer");
  assert.equal(afterEdit?.shippingAddress.addressLine1, "9 Saved Street, Tower B");

  // Neither must deleting it.
  await addresses.deleteCustomerAddress(owner.id, created.createdId);
  const afterDelete = await OrderModel.findOne({ orderId: order.orderId }).lean();
  assert.equal(afterDelete?.shippingAddress.fullName, "Snapshot Buyer");
});

test("an order referencing an unknown or foreign address is rejected", async (t) => {
  if (!transactionsAvailable) {
    t.skip("MongoDB is a standalone server; multi-document transactions are unavailable");
    return;
  }

  const owner = await registerCustomer("bad-ref");
  const stranger = await registerCustomer("bad-ref-other");
  const created = await addresses.createCustomerAddress(stranger.id, addressPayload());

  orderCounter += 1;
  await assert.rejects(
    () =>
      orders.createCodOrder(
        orderRequest({
          idempotencyKey: `saved-address-bad-key-${orderCounter}`,
          shippingAddress: undefined,
          shippingAddressId: created.createdId,
        }),
        owner.id,
      ),
    (error: unknown) => error instanceof orders.OrderServiceError && error.status === 404,
  );
});
