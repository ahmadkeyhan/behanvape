import { z } from "zod";
import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";

/* Per-productType zod schemas — the single source shared by the product API and the admin form. */

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

const notesArray = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.trim()) : v),
  z.array(z.string()).optional().default([]),
);

const optionalBoolean = z.preprocess(
  (v) => (v === undefined || v === null || v === "" ? false : v),
  z.boolean(),
);

export const baseProductSchema = z.object({
  title: z.string().trim().min(1, "نام محصول الزامی است."),
  description: z.string().trim().optional().default(""),
  brand: z.string().trim().optional().default(""),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().int().min(0),
  ),
  available: z.boolean().optional().default(true),
  images: z.array(z.string()).optional().default([]),
  category: z.string().min(1, "دسته الزامی است."),
});

// Type-specific field schemas, derived from the central PRODUCT_TYPE_FIELDS config.
export const typeFieldSchemas: Record<ProductType, z.ZodTypeAny> = {
  juice: z.object({ volume: optionalNumber, nicotineDensity: optionalNumber, notes: notesArray }),
  vape: z.object({ wattage: optionalNumber, capacity: optionalNumber, screen: optionalBoolean }),
  disposable: z.object({
    puffs: optionalNumber,
    nicotineDensity: optionalNumber,
    notes: notesArray,
    screen: optionalBoolean,
  }),
  tobacco: z.object({ weight: optionalNumber, notes: notesArray }),
  cartridge: z.object({ resistance: optionalNumber, capacity: optionalNumber }),
  iqos: z.object({
    batteryCapacity: optionalNumber,
    usesPerCharge: optionalNumber,
    chargingTime: optionalNumber,
  }),
};

/** Validates a product payload for a given type, returning base + type-specific fields merged. */
export function parseProductPayload(productType: ProductType, raw: unknown) {
  const base = baseProductSchema.parse(raw);
  const typeFields = typeFieldSchemas[productType].parse(raw);
  return { ...base, ...typeFields };
}

/* ---- Client form helpers (react-hook-form + zod) ---- */

const optionalFormNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

/** Per-productType zod schema for the admin form (notes entered as free text). */
export function getProductFormSchema(productType: ProductType) {
  const shape: z.ZodRawShape = {
    title: z.string().trim().min(1, "نام محصول الزامی است."),
    brand: z.string().trim().optional(),
    price: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : v),
      z.coerce.number().int("قیمت باید عدد صحیح باشد.").min(0),
    ),
    description: z.string().trim().optional(),
    category: z.string().min(1, "دسته الزامی است."),
  };
  for (const f of PRODUCT_TYPE_FIELDS[productType]) {
    if (f.kind === "number") shape[f.key] = optionalFormNumber;
    else if (f.kind === "boolean") shape[f.key] = z.boolean().optional().default(false);
    else shape[f.key] = z.string().optional();
  }
  return z.object(shape);
}

export type ProductFormValues = Record<string, unknown>;

/** Builds the API payload from raw form values (splits notes text into an array). */
export function formToPayload(
  productType: ProductType,
  values: ProductFormValues,
  images: string[],
  available: boolean,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    title: values.title,
    brand: values.brand ?? "",
    price: values.price ?? 0,
    description: values.description ?? "",
    category: values.category,
    images,
    available,
  };
  for (const f of PRODUCT_TYPE_FIELDS[productType]) {
    if (f.kind === "notes") {
      payload[f.key] = String(values[f.key] ?? "")
        .split(/[,\n،]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.kind === "boolean") {
      payload[f.key] = Boolean(values[f.key]);
    } else {
      payload[f.key] = values[f.key];
    }
  }
  return payload;
}
