import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import { listOrders } from "@/lib/order-service";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    return NextResponse.json({ orders: await listOrders() });
  } catch {
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
