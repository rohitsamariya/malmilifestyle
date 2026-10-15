import { NextResponse } from "next/server";
import {
  invalidJsonResponse,
  invalidOriginResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/lib/customer-api-responses";
import { authenticateRequest } from "@/lib/customerAuth";
import { isSameOriginRequest } from "@/lib/customer-origin";
import { CustomerValidationError } from "@/lib/customer-validation";
import { updateCustomerProfile } from "@/lib/customer-service";

/**
 * Update the signed-in customer's editable contact details (name and mobile).
 * The account is resolved from the session — a customer can only ever edit
 * their own record. Email is the login identity and is not editable here.
 */
export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse("Invalid profile update.");
  }

  try {
    const updated = await updateCustomerProfile(customer.id, body);
    return NextResponse.json({ customer: updated });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to update your profile right now. Please retry.");
  }
}
