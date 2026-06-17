import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type PushSubscriptionDoc = InferSchemaType<typeof PushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PushSubscription: Model<PushSubscriptionDoc> =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDoc>) ||
  mongoose.model<PushSubscriptionDoc>("PushSubscription", PushSubscriptionSchema);
