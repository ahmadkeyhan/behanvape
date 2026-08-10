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
/** "number" variants carry a numeric value (density/resistance); "color" variants carry a hex+name swatch. */
export type VariantType = "number" | "color";

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
  /** for kind "variants": the identity subfield on each option (e.g. "density", or "color"=hex). Each option also has a boolean `available`. */
  variantKey?: string;
  /** for kind "variants": numeric (default) or color-swatch flavor. Color variants also carry a `name`. */
  variantType?: VariantType;
}

/** Predefined colors the admin picks from for color variants (vape/pod). */
export const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "مشکی", hex: "#1a1a1a" },
  { name: "سفید", hex: "#f5f5f5" },
  { name: "نقره‌ای", hex: "#c0c0c0" },
  { name: "خاکستری", hex: "#6b7280" },
  { name: "طلایی", hex: "#d4af37" },
  { name: "قرمز", hex: "#dc2626" },
  { name: "آبی", hex: "#2563eb" },
  { name: "فیروزه‌ای", hex: "#06b6d4" },
  { name: "سبز", hex: "#16a34a" },
  { name: "بنفش", hex: "#7c3aed" },
  { name: "صورتی", hex: "#ec4899" },
  { name: "نارنجی", hex: "#ea580c" },
  { name: "زرد", hex: "#eab308" },
  { name: "قهوه‌ای", hex: "#92400e" },
  { name: "رزگلد", hex: "#b76e79" },
  { name: "گان متال", hex: "#4a4e54" },
  { name: "استیل", hex: "#8a8f98" },
];

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
    // colors as variants — optional; each color has its own availability.
    // Filter matches palette hex (`color`); `name` is display-only.
    {
      key: "colorOptions",
      label: "رنگ",
      kind: "variants",
      filter: "multi",
      optional: true,
      variantKey: "color",
      variantType: "color",
    },
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
    // colors as variants — optional; each color has its own availability.
    // Filter matches palette hex (`color`); `name` is display-only.
    {
      key: "colorOptions",
      label: "رنگ",
      kind: "variants",
      filter: "multi",
      optional: true,
      variantKey: "color",
      variantType: "color",
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
