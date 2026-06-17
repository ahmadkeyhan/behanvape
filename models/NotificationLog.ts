import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotificationLogSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: "" },
    targetRoute: { type: String, default: "/" },
    sentCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type NotificationLogDoc = InferSchemaType<typeof NotificationLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotificationLog: Model<NotificationLogDoc> =
  (mongoose.models.NotificationLog as Model<NotificationLogDoc>) ||
  mongoose.model<NotificationLogDoc>("NotificationLog", NotificationLogSchema);
