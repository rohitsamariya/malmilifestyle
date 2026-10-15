import { NextResponse } from "next/server";
import {
  invalidOriginResponse,
  unexpectedErrorResponse,
  validationErrorResponse,
} from "@/lib/customer-api-responses";
import { authenticateRequest } from "@/lib/customerAuth";
import { isSameOriginRequest } from "@/lib/customer-origin";
import { CustomerValidationError } from "@/lib/customer-validation";
import { setDefaultCustomerAddress } from "@/lib/address-service";

/** Marks one of the customer's own addresses as the default. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  const { addressId } = await params;

  try {
    const addresses = await setDefaultCustomerAddress(customer.id, addressId);
    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to update your default address right now. Please retry.");
  }
}
