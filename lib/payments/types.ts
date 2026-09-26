export interface PaymentRecord {
  method: "COD";
  status: "PENDING" | "PAID" | "FAILED";
  paidAt?: Date | null;
}
