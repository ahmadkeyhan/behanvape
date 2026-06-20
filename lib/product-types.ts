/*
 * Central product-type config — the single source that drives:
 *   1. the Mongoose discriminators (models/Product.ts),
 *   2. the conditional admin product form (per-type zod schema + fields),
 *   3. the public per-category filter UI and server-computed facets.
 *
 * LIMITATION: adding a genuinely new attribute shape means adding an enum value
 * here AND a matching Mongoose discriminator in models/Product.ts. Multiple
 * categories may share one productType (e.g. Juice/Salt/Cigarette all use "juice").
 */

export const PRODUCT_TYPES = [
  "juice",
  "vape",
  "disposable",
  "tobacco",
  "cartridge",
  "iqos",
  "other",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  juice: "جویس / سالت / سیگار",
  vape: "ویپ و پاد",
  disposable: "یکبارمصرف",
  tobacco: "توتون",
  cartridge: "کارتریج",
  iqos: "آیکاس",
  other: "سایر",
};

export type AttrKind = "number" | "notes" | "boolean" | "variants";
export type FilterKind = "range" | "multi" | "none" | "boolean";

export interface AttrField {
  /** document field name on the discriminator */
  key: string;
  /** Persian label */
  label: string;
  /** Persian unit suffix, if any */
  unit?: string;
  /** scalar number, list of string notes, boolean, or an array of {value, available} variants */
  kind: AttrKind;
  /** how this field appears in the public filter UI */
  filter: FilterKind;
  optional?: boolean;
  /** for kind "variants": the numeric subfield name on each option (e.g. "density"). Each option also has a boolean `available`. */
  variantKey?: string;
}

export const PRODUCT_TYPE_FIELDS: Record<ProductType, AttrField[]> = {
  juice: [
    { key: "volume", label: "حجم", unit: "میلی‌لیتر", kind: "number", filter: "multi" },
    // nicotine strengths as variants — each strength has its own availability
    {
      key: "nicotineOptions",
      label: "نیکوتین",
      unit: "میلی‌گرم",
      kind: "variants",
      filter: "multi",
      variantKey: "density",
    },
    { key: "notes", label: "نت‌های طعمی", kind: "notes", filter: "multi" },
  ],
  vape: [
    { key: "wattage", label: "توان", unit: "وات", kind: "number", filter: "range" },
    { key: "capacity", label: "ظرفیت مخزن", unit: "میلی‌لیتر", kind: "number", filter: "range" },
    {
      key: "batteryCapacity",
      label: "ظرفیت باتری",
      unit: "میلی‌آمپر",
      kind: "number",
      filter: "range",
    },
    { key: "screen", label: "نمایشگر", kind: "boolean", filter: "boolean" },
  ],
  disposable: [
    { key: "puffs", label: "تعداد پاف", unit: "پاف", kind: "number", filter: "range" },
    {
      key: "nicotineDensity",
      label: "نیکوتین",
      unit: "میلی‌گرم",
      kind: "number",
      filter: "multi",
      optional: true,
    },
    { key: "notes", label: "نت‌های طعمی", kind: "notes", filter: "multi" },
    { key: "screen", label: "نمایشگر", kind: "boolean", filter: "boolean" },
  ],
  tobacco: [
    { key: "weight", label: "وزن", unit: "گرم", kind: "number", filter: "range" },
    { key: "notes", label: "نت‌های طعمی", kind: "notes", filter: "multi" },
  ],
  cartridge: [
    // resistances as variants — each resistance has its own availability
    {
      key: "resistanceOptions",
      label: "مقاومت",
      unit: "اهم",
      kind: "variants",
      filter: "multi",
      variantKey: "resistance",
    },
    { key: "capacity", label: "ظرفیت", unit: "میلی‌لیتر", kind: "number", filter: "range" },
  ],
  // IQOS / heated-tobacco (heat-not-burn) devices: meaningful catalogue specs are
  // battery capacity, sessions per charge, charge time, plus a free-form feature list.
  iqos: [
    {
      key: "batteryCapacity",
      label: "ظرفیت باتری",
      unit: "میلی‌آمپر",
      kind: "number",
      filter: "range",
    },
    {
      key: "usesPerCharge",
      label: "دفعات مصرف با هر شارژ",
      unit: "بار",
      kind: "number",
      filter: "range",
    },
    {
      key: "chargingTime",
      label: "زمان شارژ",
      unit: "دقیقه",
      kind: "number",
      filter: "range",
      optional: true,
    },
  ],
  // "other" uses only the base product fields (title/description/brand/price/images/available).
  other: [],
};

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && (PRODUCT_TYPES as readonly string[]).includes(value);
}

/** The single variants field for a product type, if it has one (juice→nicotineOptions, cartridge→resistanceOptions). */
export function getVariantField(productType: ProductType): AttrField | undefined {
  return PRODUCT_TYPE_FIELDS[productType]?.find((f) => f.kind === "variants");
}
