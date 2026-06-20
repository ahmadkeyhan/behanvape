import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotifyRequestSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    subscription: { type: Schema.Types.ObjectId, ref: "PushSubscription", required: true },
    // For variant products (juice/cartridge): the specific numeric value the user wants alerted.
    // null for whole-product (non-variant) alerts.
    variant: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Prevent duplicate restock signups for the same product + variant + subscription.
// NOTE: drop the old `product_1_subscription_1` unique index once (db.notifyrequests.drop()).
NotifyRequestSchema.index({ product: 1, variant: 1, subscription: 1 }, { unique: true });

export type NotifyRequestDoc = InferSchemaType<typeof NotifyRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotifyRequest: Model<NotifyRequestDoc> =
  (mongoose.models.NotifyRequest as Model<NotifyRequestDoc>) ||
  mongoose.model<NotifyRequestDoc>("NotifyRequest", NotifyRequestSchema);
