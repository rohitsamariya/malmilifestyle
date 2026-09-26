import type { PaymentRecord } from "./types";

export function createCodPayment(): PaymentRecord {
  return { method: "COD", status: "PENDING" };
}

export interface CodSettlement {
  status: "PAID";
  paidAt: Date;
}

/**
 * Cash on Delivery is settled by the delivery itself: handing the parcel over
 * is what confirms the cash was collected, so no separate "mark payment
 * received" step exists. When an order is delivered this returns the payment
 * change to apply in the same atomic update as the status change.
 *
 * Returns null — meaning "leave the payment exactly as it is" — when:
 *  - the order is not COD, so a gateway-reported status must be left alone;
 *  - the payment is already PAID, so the original `paidAt` is authoritative
 *    and must never be re-stamped by a repeated request.
 */
export function codSettlementOnDelivery(
  payment: { method?: string; status?: string; paidAt?: Date | null } | null | undefined,
  now: Date,
): CodSettlement | null {
  if (payment?.method !== "COD") return null;
  if (payment.status === "PAID") return null;
  // Settling an order that somehow already has a timestamp must not move it.
  return { status: "PAID", paidAt: payment.paidAt ?? now };
}
