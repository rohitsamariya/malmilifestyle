import { NextResponse } from "next/server";
import { getOrderForCustomer } from "@/lib/order-service";
import { authenticateRequest } from "@/lib/customerAuth";

/**
 * Ownership-enforced order lookup.
 * An order that does not exist and an order owned by somebody else both answer
 * 404, so the endpoint cannot be used to discover other customers' order IDs.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { orderId } = await params;
    const order = await getOrderForCustomer(orderId, customer.id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to load this order." }, { status: 500 });
  }
}
