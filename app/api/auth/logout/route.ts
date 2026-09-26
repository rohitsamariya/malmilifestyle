import { NextResponse } from "next/server";
import { invalidOriginResponse } from "@/lib/customer-api-responses";
import { clearCustomerSession, isSameOriginRequest } from "@/lib/customerAuth";

/**
 * Signs the customer out by expiring the cookie.
 * Stateless by design: there is no server-side session store to revoke, and the
 * 7-day signed token simply stops being presented after logout.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
