import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PRODUCT_TYPES } from "../lib/product-types";

const CategorySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    // kebab-case, auto-generated from title in the route handler when omitted.
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    // S3 key for the category card image (build the URL via getPublicUrl).
    image: { type: String, default: "" },
    // Single source of truth for which discriminator/filter shape applies.
    productType: { type: String, enum: PRODUCT_TYPES, required: true },
    // Manual drag-and-drop ordering.
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ order: 1 });

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: mongoose.Types.ObjectId };

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ||
  mongoose.model<CategoryDoc>("Category", CategorySchema);
