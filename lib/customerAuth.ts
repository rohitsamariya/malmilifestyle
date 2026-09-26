/**
 * Customer authentication data-access layer.
 *
 * The customer identity is *always* derived from the signed, HTTP-only session
 * cookie and re-verified against MongoDB. A customerId supplied by the browser
 * is never accepted as proof of identity, and this module never returns
 * `passwordHash` to any caller.
 *
 * Admin authentication lives in `lib/adminAuth.ts` and is intentionally not
 * shared: separate cookie, separate token format, separate verification.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CustomerModel from "@/models/Customer";
import {
  createCustomerSessionToken,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE_OPTIONS,
  readSessionTokenFromRequest,
  verifyCustomerSessionToken,
  type CustomerSession,
} from "@/lib/customer-session";
import { loginRedirectUrl } from "@/lib/redirects";

export class CustomerAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CustomerAuthError";
  }
}

/** The only customer shape that is ever allowed to leave the server. */
export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  createdAt: string;
}

export function toCustomerDTO(customer: {
  _id: unknown;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  createdAt?: Date;
}): CustomerDTO {
  return {
    id: String(customer._id),
    name: customer.fullName ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    phoneVerified: customer.phoneVerified === true,
    createdAt: (customer.createdAt ?? new Date(0)).toISOString(),
  };
}

export const UNAUTHENTICATED_MESSAGE = "You must be signed in to do that.";

async function loadActiveCustomer(customerId: string) {
  await connectToDatabase();
  return CustomerModel.findOne({ _id: customerId, isActive: true }).lean();
}

/** Resolves a signed session token to an active customer, or null. */
export async function resolveCustomerFromToken(
  token: string | undefined,
): Promise<CustomerDTO | null> {
  const session = await verifyCustomerSessionToken(token);
  if (!session) return null;
  const customer = await loadActiveCustomer(session.customerId);
  if (!customer) return null;
  return toCustomerDTO(customer);
}

/** Reads and verifies the session cookie carried by a standard `Request`. */
export async function getCustomerForRequest(request: Request): Promise<CustomerDTO | null> {
  return resolveCustomerFromToken(readSessionTokenFromRequest(request));
}

/** Route-handler guard. Throws `CustomerAuthError` (401) when unauthenticated. */
export async function requireCustomerForRequest(request: Request): Promise<CustomerDTO> {
  const customer = await getCustomerForRequest(request);
  if (!customer) {
    throw new CustomerAuthError(UNAUTHENTICATED_MESSAGE, 401);
  }
  return customer;
}

/** Returns the customer, or a ready-to-send 401 response. */
export async function authenticateRequest(
  request: Request,
): Promise<{ customer: CustomerDTO; unauthorized?: never } | { customer?: never; unauthorized: NextResponse }> {
  const customer = await getCustomerForRequest(request);
  if (!customer) {
    return {
      unauthorized: NextResponse.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 }),
    };
  }
  return { customer };
}

/** Optimistic cookie-only check for Server Components and layouts. No database hit. */
export async function readCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  return verifyCustomerSessionToken(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
}

/** Secure check for Server Components: cookie signature *and* an active customer. */
export async function getCurrentCustomer(): Promise<CustomerDTO | null> {
  const cookieStore = await cookies();
  return resolveCustomerFromToken(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
}

/**
 * Page guard. Redirects unauthenticated visitors to
 * `/login?redirect=<returnTo>` and returns the customer otherwise.
 */
export async function requireCustomerPage(returnTo: string): Promise<CustomerDTO> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(loginRedirectUrl(returnTo));
  }
  return customer;
}

/** Issues the customer session cookie. Must be called from a Route Handler. */
export async function createCustomerSession(customerId: string): Promise<void> {
  const token = await createCustomerSessionToken(customerId);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, CUSTOMER_SESSION_COOKIE_OPTIONS);
}

/** Invalidates the customer session cookie. Must be called from a Route Handler. */
export async function clearCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, "", { ...CUSTOMER_SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Rejects state-changing requests initiated from another origin.
 * Requests without an `Origin` header (server-to-server, curl) are allowed
 * through; the session cookie is SameSite=Lax, which already blocks the
 * browser-driven cross-site POST vector.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
