import { NextResponse } from "next/server";
import { handleRazorpayWebhookRequest } from "@/lib/payments/razorpay-webhook";

/**
 * Razorpay server-to-server webhook sink.
 *
 * This endpoint is called by Razorpay, not by a browser: it deliberately has no
 * customer session requirement and no trusted-origin (CSRF) check, and it never
 * returns any order data. Requests are authenticated by the HMAC signature over
 * the raw body; see `@/lib/payments/razorpay-webhook`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { status, body } = await handleRazorpayWebhookRequest(request);
  return NextResponse.json(body, { status });
}
