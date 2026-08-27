import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";

const FA_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
const LAT_DIGITS = "01234567890123456789";

/** Lowercase + map Persian/Arabic digits → Latin for digit-friendly search. */
export function normalizeSearchText(s: string): string {
  let out = s.trim().toLowerCase();
  let mapped = "";
  for (const ch of out) {
    const i = FA_AR_DIGITS.indexOf(ch);
    mapped += i >= 0 ? LAT_DIGITS[i]! : ch;
  }
  return mapped;
}

/** Flatten searchable product fields into one haystack string. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function productSearchHaystack(p: Record<string, any>): string {
  const parts: string[] = [];

  for (const key of ["title", "brand", "description", "madeIn"] as const) {
    const v = p[key];
    if (typeof v === "string" && v.trim()) parts.push(v);
  }

  if (Array.isArray(p.notes)) {
    for (const n of p.notes) {
      if (typeof n === "string" && n.trim()) parts.push(n);
    }
  }

  if (Array.isArray(p.flavorOptions)) {
    for (const o of p.flavorOptions) {
      if (o && typeof o.name === "string" && o.name.trim()) parts.push(o.name);
    }
  }

  if (Array.isArray(p.colorOptions)) {
    for (const o of p.colorOptions) {
      if (o && typeof o.name === "string" && o.name.trim()) parts.push(o.name);
    }
  }

  const productType = p.productType as ProductType | undefined;
  if (productType && PRODUCT_TYPE_FIELDS[productType]) {
    for (const f of PRODUCT_TYPE_FIELDS[productType]) {
      const v = p[f.key];
      if (f.kind === "number" && typeof v === "number" && !Number.isNaN(v)) {
        parts.push(String(v));
      } else if (f.kind === "boolean" && typeof v === "boolean") {
        parts.push(v ? "true" : "false");
      } else if (f.kind === "string" && typeof v === "string" && v.trim()) {
        // already covered madeIn above; still fine to push again
        parts.push(v);
      } else if (f.kind === "notes" && Array.isArray(v)) {
        for (const n of v) {
          if (typeof n === "string" && n.trim()) parts.push(n);
        }
      } else if (f.kind === "variants" && Array.isArray(v)) {
        const vk = f.variantKey;
        for (const o of v) {
          if (!o || typeof o !== "object") continue;
          if (typeof o.name === "string" && o.name.trim()) parts.push(o.name);
          if (vk && o[vk] != null && o[vk] !== "") parts.push(String(o[vk]));
        }
      }
    }
  }

  return normalizeSearchText(parts.join(" "));
}

/** Case/digit-insensitive substring match. Empty q matches everything. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function matchesProductSearch(p: Record<string, any>, q: string): boolean {
  const needle = normalizeSearchText(q);
  if (!needle) return true;
  return productSearchHaystack(p).includes(needle);
}
