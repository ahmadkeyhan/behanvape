// Single source of truth for price/number formatting and slug generation.

const priceFormatter = new Intl.NumberFormat("fa-IR");

/** Toman price with Persian numerals, e.g. 250000 -> "۲۵۰٬۰۰۰ تومان". */
export function formatPrice(toman?: number | null): string {
  if (toman == null || Number.isNaN(toman)) return "—";
  return `${priceFormatter.format(toman)} تومان`;
}

/** Plain number with Persian numerals (counts, attributes). */
export function formatNumber(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return priceFormatter.format(n);
}

/** Convert ASCII digits in a string to Persian digits. */
export function toFaDigits(input: string | number): string {
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => fa[Number(d)]);
}

/**
 * kebab-case slug. Keeps Persian letters and latin alphanumerics (Persian
 * URLs are valid when percent-encoded), normalizes Arabic ya/kaf to Persian,
 * and falls back to a random suffix if nothing printable remains.
 */
export function slugify(input: string): string {
  const s = (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی") // Arabic ya -> Persian ya
    .replace(/ك/g, "ک") // Arabic kaf -> Persian kaf
    .replace(/[\s_]+/g, "-")
    .replace(/[^؀-ۿ0-9a-z-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `c-${Math.random().toString(36).slice(2, 8)}`;
}
