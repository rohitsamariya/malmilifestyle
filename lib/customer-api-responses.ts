/**
 * Shared response helpers for the customer credential endpoints.
 * Keeps register / login / logout responses shaped identically and makes sure
 * no internal error detail ever reaches the client.
 */

import { NextResponse } from "next/server";
import { CustomerValidationError } from "@/lib/customer-validation";

export function invalidOriginResponse() {
  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}

export function tooManyAttemptsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function invalidJsonResponse(message = "Invalid request.") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function validationErrorResponse(error: CustomerValidationError) {
  return NextResponse.json(
    { error: error.message, fieldErrors: error.fieldErrors },
    { status: error.status },
  );
}

export function unexpectedErrorResponse(message = "Something went wrong. Please try again.") {
  return NextResponse.json({ error: message }, { status: 500 });
}
