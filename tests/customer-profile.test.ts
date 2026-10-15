/**
 * Database-backed tests for the customer profile update: validation, the
 * ownership boundary, and the rule that changing a mobile number clears any
 * earlier verification.
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
type CustomerValidation = typeof import("@/lib/customer-validation");
type CustomerModelModule = typeof import("@/models/Customer");

let db: DbModule;
let customers: CustomerService;
let validation: CustomerValidation;
let CustomerModel: CustomerModelModule["default"];

let accountCounter = 0;

async function registerCustomer(label: string) {
  accountCounter += 1;
  return customers.registerCustomer({
    name: `${label} Buyer`,
    email: `${label}-profile-${accountCounter}@example.com`,
    password: "correct-horse",
    phone: `98765${String(10000 + accountCounter).slice(-5)}`,
  });
}

before(async () => {
  db = await import("@/lib/db");
  customers = await import("@/lib/customer-service");
  validation = await import("@/lib/customer-validation");
  CustomerModel = (await import("@/models/Customer")).default;

  await db.connectToDatabase();
  await CustomerModel.deleteMany({});
});

after(async () => {
  if (db) {
    await CustomerModel.deleteMany({});
    await db.disconnectDatabase();
  }
});

// ---------------------------------------------------------------------------
// Pure validation
// ---------------------------------------------------------------------------

test("profile input is trimmed, phone-normalized and strips unknown fields", () => {
  const parsed = validation.parseProfileUpdateInput({
    name: "  Asha   Rao  ",
    phone: "+91 98765 43210",
    email: "hacker@evil.com",
    isAdmin: true,
  });

  assert.deepEqual(parsed, { name: "Asha Rao", phone: "9876543210" });
  assert.equal("email" in parsed, false);
  assert.equal("isAdmin" in parsed, false);
});

test("profile input rejects a blank name and an invalid mobile number", () => {
  assert.throws(
    () => validation.parseProfileUpdateInput({ name: "A", phone: "9876543210" }),
    (error: unknown) =>
      error instanceof validation.CustomerValidationError &&
      error.status === 400 &&
      Boolean(error.fieldErrors.name),
  );

  assert.throws(
    () => validation.parseProfileUpdateInput({ name: "Asha Rao", phone: "12345" }),
    (error: unknown) =>
      error instanceof validation.CustomerValidationError &&
      error.status === 400 &&
      Boolean(error.fieldErrors.phone),
  );

  assert.throws(
    () => validation.parseProfileUpdateInput({ name: "Asha Rao", phone: "" }),
    (error: unknown) =>
      error instanceof validation.CustomerValidationError &&
      error.status === 400 &&
      Boolean(error.fieldErrors.phone),
  );
});

// ---------------------------------------------------------------------------
// Database update
// ---------------------------------------------------------------------------

test("a customer's name and mobile can be updated", async () => {
  const created = await registerCustomer("update");

  const updated = await customers.updateCustomerProfile(created.id, {
    name: "Asha R. Rao",
    phone: "9876500042",
  });

  assert.equal(updated.id, created.id);
  assert.equal(updated.name, "Asha R. Rao");
  assert.equal(updated.phone, "9876500042");
  assert.equal(updated.email, created.email);
  assert.equal("passwordHash" in updated, false);
  assert.equal(JSON.stringify(updated).includes("$2b$"), false);

  const stored = await CustomerModel.findById(created.id).lean();
  assert.equal(stored?.fullName, "Asha R. Rao");
  assert.equal(stored?.phone, "9876500042");
});

test("the update never touches the email even if one is supplied", async () => {
  const created = await registerCustomer("email-locked");

  const updated = await customers.updateCustomerProfile(created.id, {
    name: "Locked Email",
    phone: "9876500043",
    email: "someone-else@example.com",
  });

  assert.equal(updated.email, created.email);
  const stored = await CustomerModel.findById(created.id).lean();
  assert.equal(stored?.email, created.email);
});

test("changing the mobile number clears a prior verification", async () => {
  const created = await registerCustomer("reverify");
  await CustomerModel.updateOne({ _id: created.id }, { $set: { phoneVerified: true } });

  const changed = await customers.updateCustomerProfile(created.id, {
    name: "Reverify Buyer",
    phone: "9876500044",
  });
  assert.equal(changed.phoneVerified, false);

  // Re-verify, then save the SAME number: the flag must survive.
  await CustomerModel.updateOne({ _id: created.id }, { $set: { phoneVerified: true } });
  const unchanged = await customers.updateCustomerProfile(created.id, {
    name: "Reverify Buyer",
    phone: "9876500044",
  });
  assert.equal(unchanged.phoneVerified, true);
});

test("an update only touches the targeted account", async () => {
  const target = await registerCustomer("target");
  const other = await registerCustomer("other");

  await customers.updateCustomerProfile(target.id, {
    name: "Only Target",
    phone: "9876500045",
  });

  const untouched = await CustomerModel.findById(other.id).lean();
  assert.equal(untouched?.fullName, `${other.name}`);
  assert.equal(untouched?.phone, other.phone);
});

test("an unknown or deactivated account cannot be updated", async () => {
  await assert.rejects(
    () =>
      customers.updateCustomerProfile("65f0c0a1b2c3d4e5f6071829", {
        name: "Ghost",
        phone: "9876500046",
      }),
    (error: unknown) =>
      error instanceof validation.CustomerValidationError && error.status === 404,
  );

  const created = await registerCustomer("deactivated");
  await CustomerModel.updateOne({ _id: created.id }, { $set: { isActive: false } });

  await assert.rejects(
    () =>
      customers.updateCustomerProfile(created.id, {
        name: "Deactivated Buyer",
        phone: "9876500047",
      }),
    (error: unknown) =>
      error instanceof validation.CustomerValidationError && error.status === 404,
  );
});
