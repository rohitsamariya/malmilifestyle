import mongoose, { Schema, Document } from "mongoose";

/**
 * Durable record of every webhook event Malmi has received.
 *
 * The `{ provider, eventId }` unique index is the idempotency guard: a repeated
 * or concurrent delivery of the same gateway event can only ever create one
 * record, so it can only ever be processed once. In-memory caches are
 * deliberately not used — they do not survive a restart or span instances.
 *
 * Only non-sensitive routing metadata is stored. The raw payload (which can
 * carry customer contact details and card metadata) is never persisted here.
 */
export type WebhookEventStatus = "PROCESSING" | "PROCESSED" | "FAILED" | "IGNORED";

export interface IWebhookEvent extends Document {
  provider: "razorpay";
  eventId: string;
  eventType: string;
  status: WebhookEventStatus;
  attempts: number;
  /** Short, non-sensitive description of the outcome or failure. */
  reason?: string | null;
  /** Ownership stamp for the in-flight processing lock. */
  lockedAt?: Date | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: { type: String, required: true, enum: ["razorpay"] },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ["PROCESSING", "PROCESSED", "FAILED", "IGNORED"],
      required: true,
      default: "PROCESSING",
    },
    attempts: { type: Number, required: true, default: 1, min: 1 },
    reason: { type: String, default: null },
    lockedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One record per gateway event, forever. This is the durable dedup constraint.
WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export default mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
