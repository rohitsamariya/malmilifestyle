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
import { deleteCustomerAddress, updateCustomerAddress } from "@/lib/address-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  const { addressId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse("Invalid address.");
  }

  try {
    const addresses = await updateCustomerAddress(customer.id, addressId, body);
    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to update your address right now. Please retry.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  const { addressId } = await params;

  try {
    const addresses = await deleteCustomerAddress(customer.id, addressId);
    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof CustomerValidationError) return validationErrorResponse(error);
    return unexpectedErrorResponse("Unable to remove your address right now. Please retry.");
  }
}
