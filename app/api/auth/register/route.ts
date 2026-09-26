import { NextResponse } from "next/server";
import {
  invalidJsonResponse,
  invalidOriginResponse,
  tooManyAttemptsResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/lib/customer-api-responses";
import { createCustomerSession, isSameOriginRequest } from "@/lib/customerAuth";
import { registerCustomer } from "@/lib/customer-service";
import { CustomerValidationError } from "@/lib/customer-validation";
import { safeRedirectOr } from "@/lib/redirects";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

/** Keeps automated account creation from filling the collection. */
const REGISTER_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const limit = checkRateLimit(rateLimitKey(request, "register"), REGISTER_LIMIT, WINDOW_MS);
  if (!limit.ok) return tooManyAttemptsResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse("Invalid registration request.");
  }

  try {
    const customer = await registerCustomer(body);
    await createCustomerSession(customer.id);
    const redirect = body && typeof body === "object" ? (body as { redirect?: unknown }).redirect : undefined;
    return NextResponse.json(
      { customer, redirectTo: safeRedirectOr(redirect, "/profile") },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to create your account right now. Please retry.");
  }
}
