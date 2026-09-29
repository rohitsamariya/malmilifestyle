import test from "node:test";
import assert from "node:assert/strict";

import { parseBulkRequest, CatalogAdminError } from "@/lib/catalog-admin-service";
import { toHomepageStats } from "@/data/db-catalog-stats";
import { isSameOriginRequest } from "@/lib/customer-origin";

const parse = (body: unknown) => {
  try {
    return { value: parseBulkRequest(body) };
  } catch (error) {
    if (error instanceof CatalogAdminError) {
      return { error: error.message, errors: error.errors };
    }
    throw error;
  }
};

test("bulk request accepts a validated ids/action payload", () => {
  const result = parse({ ids: ["malmi-001", "malmi-002"], action: "deactivate" });
  assert.deepEqual(result.value, { ids: ["malmi-001", "malmi-002"], action: "deactivate" });
});

test("bulk request rejects an empty or missing id list", () => {
  for (const body of [{ action: "activate" }, { ids: [], action: "activate" }]) {
    const result = parse(body);
    assert.equal(result.error, "Select at least one record.");
  }
});

test("bulk request rejects a non-string id", () => {
  const result = parse({ ids: ["malmi-001", 42, null], action: "activate" });
  assert.equal(result.error, "Invalid request body.");
  assert.ok(result.errors.some((message: string) => message.includes("non-empty string")));
});

test("bulk request rejects an unknown action", () => {
  const result = parse({ ids: ["malmi-001"], action: "drop-database" });
  assert.equal(result.error, "Invalid request body.");
  assert.ok(result.errors.some((message: string) => message.includes("activate")));
});

test("bulk request rejects a non-object body", () => {
  for (const body of [null, "activate", ["malmi-001"], 7]) {
    const result = parse(body);
    assert.equal(result.error, "Invalid request body.");
  }
});

test("bulk request de-duplicates and trims ids", () => {
  const result = parse({ ids: [" malmi-001 ", "malmi-001", "malmi-002"], action: "activate" });
  assert.deepEqual(result.value, { ids: ["malmi-001", "malmi-002"], action: "activate" });
});

test("bulk request caps the batch size", () => {
  const ids = Array.from({ length: 501 }, (_, index) => `product-${index}`);
  const result = parse({ ids, action: "activate" });
  assert.equal(result.error, "Too many records selected.");
});

test("homepage stats reflect only categories that have visible listings", () => {
  const stats = toHomepageStats({
    totalProducts: 7,
    totalListings: 21,
    perCategory: [{ slug: "wood-pressed-oils", name: "Wood-Pressed Oils", shortName: "Oils", products: 7, listings: 21 }],
  });
  assert.deepEqual(stats, [
    { value: 7, label: "Oils" },
    { value: 21, label: "Products available" },
  ]);
});

test("homepage stats are empty when nothing is active", () => {
  const stats = toHomepageStats({ totalProducts: 0, totalListings: 0, perCategory: [] });
  assert.deepEqual(stats, []);
});

test("deactivated categories drop out of the homepage strip", () => {
  const stats = toHomepageStats({
    totalProducts: 7,
    totalListings: 21,
    perCategory: [],
  });
  assert.equal(stats.length, 0);
  assert.equal(stats.some((stat) => stat.label === "Wheat Atta"), false);
});

test("customer mutations still reject a foreign origin", () => {
  const request = new Request("https://malmilifestyle.onrender.com/api/auth/register", {
    method: "POST",
    headers: { origin: "https://evil.example", host: "malmilifestyle.onrender.com" },
  });
  const productionEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    APP_URL: "https://malmilifestyle.onrender.com",
  };
  assert.equal(isSameOriginRequest(request, productionEnv), false);
});
