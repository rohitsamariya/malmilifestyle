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
import { createCustomerAddress, listCustomerAddresses } from "@/lib/address-service";

/** The signed-in customer's own saved addresses, default first. */
export async function GET(request: Request) {
  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ addresses: await listCustomerAddresses(customer.id) });
  } catch {
    return unexpectedErrorResponse("Unable to load your addresses right now. Please retry.");
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse("Invalid address.");
  }

  try {
    const result = await createCustomerAddress(customer.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to save your address right now. Please retry.");
  }
}
