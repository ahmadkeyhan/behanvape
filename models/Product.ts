import mongoose, { Schema, type Model } from "mongoose";

/*
 * Base Product schema with discriminator key `productType`.
 *
 * `productType` is the discriminator key (Mongoose needs a literal type field on
 * each doc to validate against the right sub-schema) AND a denormalized copy of
 * the owning category's productType for fast, indexed catalogue queries. It is
 * written ONLY in the product create/update handler (copied from the category) —
 * it is never an independently editable field in the product form.
 */
const baseOptions = { discriminatorKey: "productType", timestamps: true };

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "", trim: true },
    price: { type: Number, default: 0 }, // Toman, integer
    images: { type: [String], default: [] }, // S3 keys
    available: { type: Boolean, default: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    order: { type: Number, default: 0 }, // manual sort within category
  },
  baseOptions,
);

ProductSchema.index({ category: 1, order: 1 });
ProductSchema.index({ productType: 1, available: 1 });
ProductSchema.index({ brand: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Product: Model<any> =
  (mongoose.models.Product as Model<any>) || mongoose.model("Product", ProductSchema);

// --- Discriminator sub-schemas (extra fields per productType) ---
// nicotine strengths as variants, each with its own availability
const nicotineOptionSchema = new Schema(
  { density: { type: Number }, available: { type: Boolean, default: true } },
  { _id: false },
);
const juiceSchema = new Schema({
  volume: { type: Number }, // ml
  nicotineOptions: { type: [nicotineOptionSchema], default: [] },
  notes: { type: [String], default: [] },
});

const vapeSchema = new Schema({
  wattage: { type: Number },
  capacity: { type: Number }, // tank ml
  batteryCapacity: { type: Number }, // mAh
  screen: { type: Boolean, default: false }, // has a built-in display
});

const disposableSchema = new Schema({
  puffs: { type: Number },
  // ASSUMPTION: nicotineDensity kept (common on disposables); optional.
  nicotineDensity: { type: Number },
  notes: { type: [String], default: [] },
  screen: { type: Boolean, default: false }, // has a built-in display
});

const tobaccoSchema = new Schema({
  weight: { type: Number }, // grams
  notes: { type: [String], default: [] },
});

// resistances as variants, each with its own availability
const resistanceOptionSchema = new Schema(
  { resistance: { type: Number }, available: { type: Boolean, default: true } },
  { _id: false },
);
const cartridgeSchema = new Schema({
  resistanceOptions: { type: [resistanceOptionSchema], default: [] },
  capacity: { type: Number }, // ml
});

const iqosSchema = new Schema({
  batteryCapacity: { type: Number }, // mAh
  usesPerCharge: { type: Number }, // sessions per full charge
  chargingTime: { type: Number }, // minutes
});

// "other": no extra fields — base schema only (title/description/brand/price/images/available).
const otherSchema = new Schema({});

const discriminatorSchemas: Record<string, Schema> = {
  juice: juiceSchema,
  vape: vapeSchema,
  disposable: disposableSchema,
  tobacco: tobaccoSchema,
  cartridge: cartridgeSchema,
  iqos: iqosSchema,
  other: otherSchema,
};

for (const [name, schema] of Object.entries(discriminatorSchemas)) {
  if (!Product.discriminators || !Product.discriminators[name]) {
    Product.discriminator(name, schema);
  }
}
