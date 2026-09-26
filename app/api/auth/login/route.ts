import { NextResponse } from "next/server";
import {
  invalidJsonResponse,
  invalidOriginResponse,
  tooManyAttemptsResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/lib/customer-api-responses";
import { createCustomerSession, isSameOriginRequest } from "@/lib/customerAuth";
import { INVALID_CREDENTIALS_MESSAGE, authenticateCustomer } from "@/lib/customer-service";
import { CustomerValidationError } from "@/lib/customer-validation";
import { safeRedirectOr } from "@/lib/redirects";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

/** Credential stuffing guard. */
const LOGIN_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const limit = checkRateLimit(rateLimitKey(request, "login"), LOGIN_LIMIT, WINDOW_MS);
  if (!limit.ok) return tooManyAttemptsResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse("Invalid login request.");
  }

  try {
    const customer = await authenticateCustomer(body);
    if (!customer) {
      // Same status, same message for unknown email, wrong password and
      // deactivated accounts — no account enumeration.
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }
    await createCustomerSession(customer.id);
    const redirect = body && typeof body === "object" ? (body as { redirect?: unknown }).redirect : undefined;
    return NextResponse.json({ customer, redirectTo: safeRedirectOr(redirect, "/profile") });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to sign you in right now. Please retry.");
  }
}
