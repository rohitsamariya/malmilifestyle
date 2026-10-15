import type { PaymentRecord } from "./types";

/**
 * The payment record an online order starts with. It is PENDING until either the
 * client handoff is verified or a `payment.captured` webhook arrives; the server
 * only ever moves it forward from here.
 */
export function createRazorpayPayment(): PaymentRecord {
  return { method: "RAZORPAY", status: "PENDING", currency: "INR" };
}
