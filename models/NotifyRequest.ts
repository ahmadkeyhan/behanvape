import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotifyRequestSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    subscription: { type: Schema.Types.ObjectId, ref: "PushSubscription", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Prevent duplicate restock signups for the same product + subscription.
NotifyRequestSchema.index({ product: 1, subscription: 1 }, { unique: true });

export type NotifyRequestDoc = InferSchemaType<typeof NotifyRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotifyRequest: Model<NotifyRequestDoc> =
  (mongoose.models.NotifyRequest as Model<NotifyRequestDoc>) ||
  mongoose.model<NotifyRequestDoc>("NotifyRequest", NotifyRequestSchema);
