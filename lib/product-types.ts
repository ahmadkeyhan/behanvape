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
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  juice: "جویس / سالت / سیگار",
  vape: "ویپ و پاد",
  disposable: "یکبارمصرف",
  tobacco: "توتون",
  cartridge: "کارتریج",
  iqos: "آیکاس",
};

export type AttrKind = "number" | "notes" | "boolean";
export type FilterKind = "range" | "multi" | "none" | "boolean";

export interface AttrField {
  /** document field name on the discriminator */
  key: string;
  /** Persian label */
  label: string;
  /** Persian unit suffix, if any */
  unit?: string;
  /** scalar number vs. a list of string notes */
  kind: AttrKind;
  /** how this field appears in the public filter UI */
  filter: FilterKind;
  optional?: boolean;
}

export const PRODUCT_TYPE_FIELDS: Record<ProductType, AttrField[]> = {
  juice: [
    { key: "volume", label: "حجم", unit: "میلی‌لیتر", kind: "number", filter: "multi" },
    { key: "nicotineDensity", label: "نیکوتین", unit: "میلی‌گرم", kind: "number", filter: "multi" },
    { key: "notes", label: "نت‌های طعمی", kind: "notes", filter: "multi" },
  ],
  vape: [
    { key: "wattage", label: "توان", unit: "وات", kind: "number", filter: "range" },
    { key: "capacity", label: "ظرفیت", unit: "میلی‌لیتر", kind: "number", filter: "range" },
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
    { key: "resistance", label: "مقاومت", unit: "اهم", kind: "number", filter: "range" },
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
};

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && (PRODUCT_TYPES as readonly string[]).includes(value);
}
