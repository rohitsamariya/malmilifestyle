import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantSize: string;
  productImage: string;
  unitPrice: number; // Purchased unit price snapshot
  unitMrp: number | null; // Purchased unit MRP snapshot
  quantity: number;
  itemTotal: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

/** A gateway-reported refund recorded against an order. Never created by Malmi. */
export interface IOrderRefund {
  /** Razorpay refund id (`rfnd_...`). Idempotency key for a refund. */
  refundId: string;
  /** Razorpay payment id the refund belongs to (`pay_...`). */
  paymentId: string;
  /** Refund amount in the currency's minor unit (paise), as reported. */
  amount: number | null;
  currency: string;
  /** Malmi's normalized view of the gateway-reported refund state. */
  status: "CREATED" | "PROCESSED" | "FAILED";
  /** Raw gateway status string, kept verbatim for reconciliation. */
  gatewayStatus?: string | null;
  /** Gateway-reported creation time. */
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderPayment {
  method: "COD" | "RAZORPAY";
  status: "PENDING" | "PAID" | "FAILED";
  /**
   * Server-created Razorpay order reference (`order_...`). The only safe way to
   * associate an incoming webhook with an order. Never accepted from the client.
   */
  gatewayOrderId?: string | null;
  /** The captured Razorpay payment id (`pay_...`) for a successful attempt. */
  gatewayPaymentId?: string | null;
  /** Expected settlement currency for online payments. Null means the INR default. */
  currency?: string | null;
}

export interface IOrder extends Document {
  orderId: string; // e.g. "MALMI-2026-1001"
  idempotencyKey?: string;
  customerId?: mongoose.Types.ObjectId | null;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  payment: IOrderPayment;
  shipment: {
    provider: "MANUAL";
    status: "NOT_CREATED";
  };
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  /** Set when a payment is confirmed (COD delivery or a captured online payment). */
  paidAt?: Date | null;
  /** Gateway refunds recorded from verified webhooks. Empty for cash orders. */
  refunds: IOrderRefund[];
  orderStatus: "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  stockRestored: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },
    variantSize: { type: String, required: true },
    productImage: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    unitMrp: { type: Number, default: null },
    quantity: { type: Number, required: true, min: 1 },
    itemTotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderRefundSchema = new Schema<IOrderRefund>(
  {
    refundId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, default: null },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["CREATED", "PROCESSED", "FAILED"], required: true },
    gatewayStatus: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, default: undefined },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    items: [OrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    payment: {
      method: { type: String, enum: ["COD", "RAZORPAY"], required: true, default: "COD" },
      status: { type: String, enum: ["PENDING", "PAID", "FAILED"], required: true, default: "PENDING" },
      gatewayOrderId: { type: String, default: null },
      gatewayPaymentId: { type: String, default: null },
      currency: { type: String, default: null },
    },
    shipment: {
      provider: { type: String, enum: ["MANUAL"], required: true, default: "MANUAL" },
      status: { type: String, enum: ["NOT_CREATED"], required: true, default: "NOT_CREATED" },
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    // Stamped when payment is confirmed; never set by the customer or the client.
    paidAt: { type: Date, default: null },
    refunds: { type: [OrderRefundSchema], default: [] },
    orderStatus: {
      type: String,
      enum: ["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
    stockRestored: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

// Idempotency is scoped per customer: a key may only ever replay the
// requesting customer's own order, and two different customers may legitimately
// use the same generated key.
OrderSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

// Online-payment webhooks resolve an order from the server-created Razorpay
// references only. Partial indexes keep the unique constraint off cash orders,
// where these fields are null.
OrderSchema.index(
  { "payment.gatewayOrderId": 1 },
  { partialFilterExpression: { "payment.gatewayOrderId": { $type: "string" } } }
);
OrderSchema.index(
  { "payment.gatewayPaymentId": 1 },
  { partialFilterExpression: { "payment.gatewayPaymentId": { $type: "string" } } }
);

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
