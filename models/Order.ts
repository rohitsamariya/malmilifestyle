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
  payment: {
    method: "COD";
    status: "PENDING" | "PAID" | "FAILED";
  };
  shipment: {
    provider: "MANUAL";
    status: "NOT_CREATED";
  };
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  /** Set when a COD order is delivered and the cash is therefore collected. */
  paidAt?: Date | null;
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
      method: { type: String, enum: ["COD"], required: true, default: "COD" },
      status: { type: String, enum: ["PENDING", "PAID", "FAILED"], required: true, default: "PENDING" },
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
    // Stamped by the COD delivery rule; never set by the customer or the client.
    paidAt: { type: Date, default: null },
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

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
