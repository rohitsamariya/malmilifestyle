import { NextResponse } from "next/server";
import {
  createCodOrder,
  getOrderForCustomer,
  listOrdersForCustomer,
  OrderServiceError,
} from "@/lib/order-service";
import { authenticateRequest, isSameOriginRequest } from "@/lib/customerAuth";

/** Customer session required. No anonymous order placement, no anonymous history. */
export async function GET(request: Request) {
  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const orders = await listOrdersForCustomer(customer.id);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Unable to load your orders right now. Please retry." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // Placing an order spends real stock, so a cross-site request must never be
  // able to trigger one. The session cookie is SameSite=Lax, and this explicit
  // origin check closes the remaining gap.
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { customer, unauthorized } = await authenticateRequest(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid order request." }, { status: 400 });
  }

  try {
    // customerId comes from the verified session only — never from the body.
    const order = await createCodOrder(body, customer.id);
    const confirmation = await getOrderForCustomer(order.orderId, customer.id);
    return NextResponse.json({ order: confirmation }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Unable to place your order right now. Please retry." },
      { status: 500 },
    );
  }
}
