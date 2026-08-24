/** Slugify a product brand for /products/[slug]/[brand] URLs. */
export function slugifyBrand(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Find the stored brand string whose slug matches `slug`, or null. */
export function resolveBrandFromSlug(brands: string[], slug: string): string | null {
  const needle = slug.trim().toLowerCase();
  if (!needle || needle === "all") return null;
  return brands.find((b) => slugifyBrand(b) === needle) ?? null;
}
