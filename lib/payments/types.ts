export interface PaymentRecord {
  method: "COD" | "RAZORPAY";
  status: "PENDING" | "PAID" | "FAILED";
  paidAt?: Date | null;
  /** Server-created Razorpay order reference (`order_...`), online payments only. */
  gatewayOrderId?: string | null;
  /** Captured Razorpay payment id (`pay_...`), set once a payment succeeds. */
  gatewayPaymentId?: string | null;
  /** Expected settlement currency. Null means the INR default. */
  currency?: string | null;
}
