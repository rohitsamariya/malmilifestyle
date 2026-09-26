import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import {
  getOrderForAdmin,
  OrderServiceError,
  updateOrderStatus,
} from "@/lib/order-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { orderId } = await params;
    const order = await getOrderForAdmin(orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to load order details." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  }

  try {
    const { orderId } = await params;
    const status = typeof body === "object" && body !== null && "orderStatus" in body
      ? body.orderStatus
      : undefined;
    const order = await updateOrderStatus(orderId, status);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
