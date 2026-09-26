import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { codSettlementOnDelivery, createCodPayment } from "@/lib/payments/cod";
import { calculateManualShipping, createManualShipment } from "@/lib/shipping/manual";
import CategoryModel from "@/models/Category";
import OrderModel, { type IOrder, type IOrderAddress } from "@/models/Order";
import ProductModel from "@/models/Product";


export class OrderServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

interface RequestedItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CreateOrderInput {
  idempotencyKey: string;
  paymentMethod: "COD";
  items: RequestedItem[];
  shippingAddress: IOrderAddress;
}

const ORDER_STATUSES = ["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

interface CatalogVariant {
  variantId: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  image: string | null;
}

interface CatalogProduct {
  productId: string;
  name: string;
  slug: string;
  isActive: boolean;
  variants: CatalogVariant[];
}

export function validateCatalogSelection(
  product: CatalogProduct | null,
  category: { isActive: boolean } | null,
  variantId: string,
  quantity: number,
): CatalogVariant {
  if (!product) throw new OrderServiceError("A product in your cart is no longer available.", 404);
  if (!product.isActive) throw new OrderServiceError(`${product.name} is currently unavailable.`, 409);
  if (!category) throw new OrderServiceError(`${product.name} has an invalid category.`, 409);
  if (!category.isActive) throw new OrderServiceError(`${product.name} is currently unavailable.`, 409);

  const variant = product.variants.find((item) => item.variantId === variantId);
  if (!variant) throw new OrderServiceError("A selected product variant no longer exists.", 404);
  if (!variant.isActive) throw new OrderServiceError("A selected product variant is currently unavailable.", 409);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new OrderServiceError("Quantity must be a positive whole number.", 400);
  }
  if (quantity > variant.stock) {
    throw new OrderServiceError(`Only ${variant.stock} units of ${product.name} are available.`, 409);
  }
  return variant;
}

export function stockDeductionFilter(productId: string, variantId: string, quantity: number) {
  return {
    productId,
    isActive: true,
    variants: {
      $elemMatch: {
        variantId,
        isActive: true,
        stock: { $gte: quantity },
      },
    },
  };
}

export function canCancelOrder(status: string): boolean {
  return status === "PLACED" || status === "PACKED";
}

export function shouldRestoreOrderStock(status: string, stockRestored: boolean | undefined): boolean {
  return canCancelOrder(status) && !stockRestored;
}

export function nextFulfillmentStatus(status: string): OrderStatus | null {
  const next: Partial<Record<OrderStatus, OrderStatus>> = {
    PLACED: "PACKED",
    PACKED: "SHIPPED",
    SHIPPED: "DELIVERED",
  };
  return next[status as OrderStatus] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== "string") {
    throw new OrderServiceError(`${field} is required.`, 400);
  }
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new OrderServiceError(`${field} is invalid.`, 400);
  }
  return text;
}

function parseShippingAddress(value: unknown): IOrderAddress {
  if (!isRecord(value)) {
    throw new OrderServiceError("Delivery address is required.", 400);
  }

  const fullName = requiredText(value.fullName, "Full name");
  const phone = requiredText(value.phone, "Mobile number", 32);
  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(normalizedPhone)) {
    throw new OrderServiceError("Enter a valid 10-digit mobile number.", 400);
  }

  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new OrderServiceError("Enter a valid email address.", 400);
  }

  const pincode = requiredText(value.pincode, "Pincode", 6);
  if (!/^\d{6}$/.test(pincode)) {
    throw new OrderServiceError("Enter a valid 6-digit pincode.", 400);
  }

  const addressLine2 = typeof value.addressLine2 === "string" ? value.addressLine2.trim() : "";
  if (addressLine2.length > 200) {
    throw new OrderServiceError("Address line 2 is too long.", 400);
  }

  return {
    fullName,
    phone,
    email,
    addressLine1: requiredText(value.addressLine1, "Address line 1"),
    addressLine2,
    city: requiredText(value.city, "City"),
    state: requiredText(value.state, "State"),
    pincode,
  };
}

export function parseCreateOrderInput(value: unknown): CreateOrderInput {
  if (!isRecord(value)) {
    throw new OrderServiceError("Invalid order request.", 400);
  }
  if (value.paymentMethod !== "COD") {
    throw new OrderServiceError("Cash on Delivery is the only available payment method.", 400);
  }
  if (typeof value.idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{12,100}$/.test(value.idempotencyKey)) {
    throw new OrderServiceError("Invalid checkout request. Please retry checkout.", 400);
  }
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 50) {
    throw new OrderServiceError("Your cart is empty or contains too many items.", 400);
  }

  const quantities = new Map<string, RequestedItem>();
  for (const rawItem of value.items) {
    if (!isRecord(rawItem)) {
      throw new OrderServiceError("Invalid cart item.", 400);
    }
    const productId = requiredText(rawItem.productId, "Product", 100);
    const variantId = requiredText(rawItem.variantId, "Variant", 100);
    const quantity = rawItem.quantity;
    if (!Number.isSafeInteger(quantity) || (quantity as number) <= 0) {
      throw new OrderServiceError("Quantity must be a positive whole number.", 400);
    }
    const key = `${productId}\u0000${variantId}`;
    const previous = quantities.get(key);
    const totalQuantity = (previous?.quantity ?? 0) + (quantity as number);
    if (!Number.isSafeInteger(totalQuantity)) {
      throw new OrderServiceError("Requested quantity is invalid.", 400);
    }
    quantities.set(key, { productId, variantId, quantity: totalQuantity });
  }

  return {
    idempotencyKey: value.idempotencyKey,
    paymentMethod: "COD",
    items: Array.from(quantities.values()),
    shippingAddress: parseShippingAddress(value.shippingAddress),
  };
}

export async function createCodOrder(
  rawInput: unknown,
  customerId: mongoose.Types.ObjectId | string,
): Promise<IOrder> {
  if (!customerId) {
    throw new OrderServiceError("You must be signed in to place an order.", 401);
  }
  const input = parseCreateOrderInput(rawInput);
  await connectToDatabase();
  const session = await mongoose.startSession();
  let result: IOrder | null = null;

  try {
    await session.withTransaction(async () => {
      // Scoped by customer so an idempotency key can only ever replay the
      // requesting customer's own order.
      const priorOrder = await OrderModel.findOne({
        idempotencyKey: input.idempotencyKey,
        customerId,
      })
        .session(session)
        .lean();
      if (priorOrder) {
        result = priorOrder as IOrder;
        return;
      }

      const snapshots: Array<{
        productId: string;
        variantId: string;
        productSlug: string;
        productName: string;
        variantSize: string;
        productImage: string;
        unitPrice: number;
        unitMrp: number | null;
        quantity: number;
        itemTotal: number;
      }> = [];

      for (const requested of input.items) {
        const product = await ProductModel.findOne({ productId: requested.productId }).session(session).lean();
        const category = product
          ? await CategoryModel.findOne({ categoryId: product.categoryId }).session(session).lean()
          : null;
        const variant = validateCatalogSelection(product, category, requested.variantId, requested.quantity);

        const stockUpdate = await ProductModel.updateOne(
          stockDeductionFilter(requested.productId, requested.variantId, requested.quantity),
          { $inc: { "variants.$[variant].stock": -requested.quantity } },
          {
            arrayFilters: [
              {
                "variant.variantId": requested.variantId,
                "variant.isActive": true,
                "variant.stock": { $gte: requested.quantity },
              },
            ],
            session,
          },
        );
        if (stockUpdate.modifiedCount !== 1) {
          throw new OrderServiceError("Stock changed while placing your order. Please review your cart.", 409);
        }

        const unitPrice = Number(variant.price);
        const unitMrp = variant.compareAtPrice == null ? null : Number(variant.compareAtPrice);
        snapshots.push({
          productId: product.productId,
          variantId: variant.variantId,
          productSlug: product.slug,
          productName: product.name,
          variantSize: variant.size,
          productImage: variant.image || "",
          unitPrice,
          unitMrp,
          quantity: requested.quantity,
          itemTotal: unitPrice * requested.quantity,
        });
      }

      const subtotal = snapshots.reduce((sum, item) => sum + item.itemTotal, 0);
      const shippingFee = calculateManualShipping();
      const discountAmount = 0;
      const orderId = `MALMI-${new Date().getFullYear()}-${randomUUID()}`;
      const [order] = await OrderModel.create(
        [{
          orderId,
          idempotencyKey: input.idempotencyKey,
          customerId,
          items: snapshots,
          shippingAddress: input.shippingAddress,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount: subtotal + shippingFee - discountAmount,
          payment: createCodPayment(),
          paymentStatus: "PENDING",
          shipment: createManualShipment(),
          orderStatus: "PLACED",
          stockRestored: false,
        }],
        { session },
      );
      result = order;
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const priorOrder = await OrderModel.findOne({
        idempotencyKey: input.idempotencyKey,
        customerId,
      }).lean();
      if (priorOrder) return priorOrder as IOrder;
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!result) throw new Error("Order transaction completed without an order.");
  return result;
}

function isDuplicateKeyError(error: unknown): boolean {
  return isRecord(error) && error.code === 11000;
}

export interface OrderItemDTO {
  productName: string;
  productSlug: string;
  variantSize: string;
  quantity: number;
  unitPrice: number;
  unitMrp: number | null;
  itemTotal: number;
  productImage: string;
}

export interface CustomerOrderDTO {
  orderId: string;
  orderStatus: IOrder["orderStatus"];
  createdAt: Date;
  itemCount: number;
  items: OrderItemDTO[];
  shippingAddress: IOrderAddress;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  payment: { method: string; status: string };
  paidAt?: Date | null;
  shipment: { provider: string; status: string };
}

export interface CustomerOrderSummaryDTO {
  orderId: string;
  orderStatus: IOrder["orderStatus"];
  createdAt: Date;
  itemCount: number;
  totalAmount: number;
  payment: { method: string; status: string };
  paidAt?: Date | null;
  shipment: { provider: string; status: string };
}

function countOrderItems(items: IOrder["items"]): number {
  return (items ?? []).reduce((total, item) => total + item.quantity, 0);
}

function toOrderItemDTOs(items: IOrder["items"]): OrderItemDTO[] {
  return (items ?? []).map((item) => ({
    productName: item.productName,
    productSlug: item.productSlug,
    variantSize: item.variantSize,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unitMrp: item.unitMrp ?? null,
    itemTotal: item.itemTotal,
    productImage: item.productImage,
  }));
}

function toOrderSummary(order: {
  orderId: string;
  orderStatus: IOrder["orderStatus"];
  createdAt: Date;
  items: IOrder["items"];
  totalAmount: number;
  payment?: { method?: string; status?: string };
  paymentStatus?: string;
  paidAt?: Date | null;
  shipment?: { provider?: string; status?: string };
}): CustomerOrderSummaryDTO {
  return {
    orderId: order.orderId,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    itemCount: countOrderItems(order.items),
    totalAmount: order.totalAmount,
    payment: {
      method: order.payment?.method ?? "COD",
      status: order.payment?.status ?? order.paymentStatus ?? "PENDING",
    },
    paidAt: order.paidAt ?? null,
    shipment: {
      provider: order.shipment?.provider ?? "MANUAL",
      status: order.shipment?.status ?? "NOT_CREATED",
    },
  };
}

/**
 * Order lookup scoped to the authenticated customer.
 * Returns null — so the caller answers 404 — when the order does not exist or
 * belongs to somebody else. Never distinguishes the two cases.
 */
export async function getOrderForCustomer(
  orderId: string,
  customerId: mongoose.Types.ObjectId | string,
): Promise<CustomerOrderDTO | null> {
  if (!customerId) return null;
  await connectToDatabase();
  const order = await OrderModel.findOne({ orderId, customerId }).lean();
  if (!order) return null;
  return {
    orderId: order.orderId,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    itemCount: countOrderItems(order.items),
    items: toOrderItemDTOs(order.items),
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    payment: {
      method: order.payment?.method ?? "COD",
      status: order.payment?.status ?? order.paymentStatus ?? "PENDING",
    },
    paidAt: order.paidAt ?? null,
    shipment: {
      provider: order.shipment?.provider ?? "MANUAL",
      status: order.shipment?.status ?? "NOT_CREATED",
    },
  };
}

/** The authenticated customer's own orders, newest first. Never anybody else's. */
export async function listOrdersForCustomer(
  customerId: mongoose.Types.ObjectId | string,
): Promise<CustomerOrderSummaryDTO[]> {
  if (!customerId) return [];
  await connectToDatabase();
  const orders = await OrderModel.find({ customerId })
    .select("orderId items totalAmount payment paymentStatus paidAt shipment orderStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return orders.map(toOrderSummary);
}

export async function listOrders() {
  await connectToDatabase();
  return OrderModel.find({})
    .select("orderId shippingAddress.fullName totalAmount payment paymentStatus paidAt orderStatus shipment createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getOrderForAdmin(orderId: string) {
  await connectToDatabase();
  return OrderModel.findOne({ orderId }).lean();
}

export async function updateOrderStatus(orderId: string, nextStatus: unknown): Promise<IOrder> {
  if (typeof nextStatus !== "string" || !ORDER_STATUSES.includes(nextStatus as OrderStatus)) {
    throw new OrderServiceError("Invalid order status.", 400);
  }
  if (nextStatus === "CANCELLED") return cancelOrder(orderId);
  await connectToDatabase();

  const current = await OrderModel.findOne({ orderId });
  if (!current) throw new OrderServiceError("Order not found.", 404);

  // Re-requesting the status an order already has is a safe no-op. It still
  // reconciles COD settlement, so an order delivered before the rule existed can
  // be re-processed through this same admin endpoint.
  if (current.orderStatus === nextStatus) {
    return settleDeliveredCodPayment(current);
  }

  const currentStatus = current.orderStatus as OrderStatus;
  if (nextFulfillmentStatus(currentStatus) !== nextStatus) {
    throw new OrderServiceError("Order status can only move through the fulfillment sequence.", 409);
  }

  // COD payment is confirmed by the delivery, so it is written by the very same
  // atomic update that moves the order to DELIVERED. No second admin click.
  const settlement = nextStatus === "DELIVERED"
    ? codSettlementOnDelivery(current.payment, new Date())
    : null;

  const update: Record<string, unknown> = { $set: { orderStatus: nextStatus } };
  if (settlement) {
    (update.$set as Record<string, unknown>).paymentStatus = "PAID";
    (update.$set as Record<string, unknown>)["payment.status"] = "PAID";
    (update.$set as Record<string, unknown>).paidAt = settlement.paidAt;
  }

  const updated = await OrderModel.findOneAndUpdate(
    { orderId, orderStatus: current.orderStatus },
    update,
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) throw new OrderServiceError("Order changed concurrently. Refresh and retry.", 409);
  return updated;
}

/**
 * Brings a delivered COD order's payment in line with the COD rule without
 * touching the order status. Deliberately convergent: it only ever moves an
 * unsettled COD order to PAID, and never rewrites a `paidAt` that already exists.
 */
async function settleDeliveredCodPayment(order: IOrder): Promise<IOrder> {
  if (order.orderStatus !== "DELIVERED") return order;
  const settlement = codSettlementOnDelivery(order.payment, new Date());
  if (!settlement) return order;

  const updated = await OrderModel.findOneAndUpdate(
    { _id: order._id, orderStatus: "DELIVERED", "payment.status": { $ne: "PAID" } },
    {
      $set: {
        paymentStatus: "PAID",
        "payment.status": "PAID",
        paidAt: settlement.paidAt,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (updated) return updated;

  // Lost the race to a concurrent settlement: report the stored truth.
  const current = await OrderModel.findById(order._id);
  if (!current) throw new OrderServiceError("Order not found.", 404);
  return current;
}

export async function cancelOrder(orderId: string): Promise<IOrder> {
  await connectToDatabase();
  const session = await mongoose.startSession();
  let result: IOrder | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findOne({ orderId }).session(session);
      if (!order) throw new OrderServiceError("Order not found.", 404);
      if (order.orderStatus === "CANCELLED") {
        result = order;
        return;
      }
      if (!canCancelOrder(order.orderStatus)) {
        throw new OrderServiceError("Only orders that have not shipped can be cancelled.", 409);
      }
      if (!shouldRestoreOrderStock(order.orderStatus, order.stockRestored)) {
        throw new OrderServiceError("Order inventory was already restored.", 409);
      }

      for (const item of order.items) {
        const restore = await ProductModel.updateOne(
          {
            productId: item.productId,
            variants: { $elemMatch: { variantId: item.variantId } },
          },
          { $inc: { "variants.$[variant].stock": item.quantity } },
          {
            arrayFilters: [{ "variant.variantId": item.variantId }],
            session,
          },
        );
        if (restore.modifiedCount !== 1) {
          throw new OrderServiceError("Order inventory could not be restored safely.", 409);
        }
      }

      const cancelled = await OrderModel.findOneAndUpdate(
        { _id: order._id, orderStatus: { $in: ["PLACED", "PACKED"] }, stockRestored: { $ne: true } },
        { $set: { orderStatus: "CANCELLED", stockRestored: true } },
        { new: true, session, runValidators: true },
      );
      if (!cancelled) throw new OrderServiceError("Order changed concurrently. Refresh and retry.", 409);
      result = cancelled;
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new Error("Cancellation transaction completed without an order.");
  return result;
}
