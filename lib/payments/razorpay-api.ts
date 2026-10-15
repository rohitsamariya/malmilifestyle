/**
 * Minimal Razorpay REST client (server-only).
 *
 * Only the two calls the checkout flow needs are implemented, against Razorpay's
 * documented v1 REST API, using global `fetch` and HTTP Basic auth with the key
 * id/secret. No SDK dependency is added for two endpoints.
 *
 * Nothing here reads configuration at module load: the credentials are resolved
 * per call, so unrelated build-time analysis never requires them to be present.
 * The key secret is only ever placed in the `Authorization` header; it is never
 * logged and never included in a response body.
 *
 * `baseUrl` and `fetchImpl` are injectable purely so tests can point the client
 * at a local stub instead of the live API.
 */

import { getRazorpayKeyId, getRazorpayKeySecret } from "@/lib/payments/razorpay";

const DEFAULT_API_BASE_URL = "https://api.razorpay.com";

export class RazorpayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "RazorpayApiError";
  }
}

export interface RazorpayApiOptions {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface CreateRazorpayOrderParams {
  /** Amount in the currency's minor unit (paise for INR). */
  amount: number;
  currency: string;
  /** Merchant-side reference; the Malmi order id is used here. */
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  currency: string;
  receipt?: string | null;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: string;
  order_id?: string | null;
}

function apiBaseUrl(options: RazorpayApiOptions): string {
  const env = options.env ?? process.env;
  const configured = options.baseUrl ?? env.RAZORPAY_API_BASE_URL;
  return (configured && configured.trim() ? configured.trim() : DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function authorizationHeader(env: NodeJS.ProcessEnv): string {
  const keyId = getRazorpayKeyId(env);
  const keySecret = getRazorpayKeySecret(env);
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64")}`;
}

async function requestJson(
  path: string,
  init: { method: string; body?: string },
  options: RazorpayApiOptions,
): Promise<unknown> {
  const env = options.env ?? process.env;
  const doFetch = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await doFetch(`${apiBaseUrl(options)}${path}`, {
      method: init.method,
      headers: {
        Authorization: authorizationHeader(env),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body,
      signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
    });
  } catch (cause) {
    // Network failure or timeout. The message is deliberately generic so no
    // credential or upstream detail can leak through the caller's error.
    throw new RazorpayApiError("Razorpay request failed.", 0, { cause });
  }

  if (!response.ok) {
    throw new RazorpayApiError(`Razorpay responded with ${response.status}.`, response.status);
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new RazorpayApiError("Razorpay returned a malformed response.", response.status);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Creates a gateway order so the browser can open Razorpay Checkout. */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams,
  options: RazorpayApiOptions = {},
): Promise<RazorpayOrder> {
  const payload = JSON.stringify({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });

  const parsed = asRecord(await requestJson("/v1/orders", { method: "POST", body: payload }, options));
  const id = parsed && readString(parsed, "id");
  if (!parsed || !id || !id.startsWith("order_")) {
    throw new RazorpayApiError("Razorpay did not return an order id.", 200);
  }

  return {
    id,
    entity: "order",
    amount: readNumber(parsed, "amount") ?? params.amount,
    currency: readString(parsed, "currency") ?? params.currency,
    receipt: readString(parsed, "receipt") ?? params.receipt ?? null,
    status: readString(parsed, "status") ?? "created",
  };
}

/** Fetches the authoritative payment record, used to verify amount and currency. */
export async function fetchRazorpayPayment(
  paymentId: string,
  options: RazorpayApiOptions = {},
): Promise<RazorpayPayment> {
  const parsed = asRecord(
    await requestJson(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: "GET" }, options),
  );
  const id = parsed && readString(parsed, "id");
  if (!parsed || !id || !id.startsWith("pay_")) {
    throw new RazorpayApiError("Razorpay did not return a payment.", 200);
  }

  return {
    id,
    entity: "payment",
    amount: readNumber(parsed, "amount") ?? 0,
    currency: readString(parsed, "currency") ?? "",
    status: readString(parsed, "status") ?? "",
    order_id: readString(parsed, "order_id"),
  };
}
