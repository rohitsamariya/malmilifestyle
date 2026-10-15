import { NextResponse } from "next/server";
import { OrderServiceError, verifyOnlineOrderPayment } from "@/lib/order-service";
import { authenticateRequest } from "@/lib/customerAuth";
import { invalidOriginResponse } from "@/lib/customer-api-responses";
import { isSameOriginRequest } from "@/lib/customer-origin";

/**
 * Confirms a Razorpay Checkout handoff for the signed-in customer's own order.
 *
 * The signature is verified server-side and the amount is re-checked against
 * the stored order, so a browser can never mark an order paid on its own word.
 * The webhook is the independent source of truth and will converge on the same
 * state even if this fast path is never reached.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
  }

  try {
    const { orderId } = await params;
    const result = await verifyOnlineOrderPayment(orderId, body, customer.id);
    return NextResponse.json({ order: result.order, paymentStatus: result.status });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Unable to confirm your payment right now. Please retry." },
      { status: 500 },
    );
  }
}
