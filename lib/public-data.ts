import { dbConnect } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { getPublicUrl } from "@/lib/s3";
import { serialize } from "@/lib/serialize";
import { toProductView } from "@/lib/product-view";
import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";

export const PER_PAGE = 12;

export interface PublicCategory {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  imageUrl: string;
  productType: ProductType;
  order: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PublicProduct = Record<string, any> & {
  _id: string;
  title: string;
  brand: string;
  price: number;
  available: boolean;
  images: string[];
  imageUrls: string[];
  productType: ProductType;
  notes?: string[];
  createdAt: string;
};

export async function getCategories(): Promise<PublicCategory[]> {
  await dbConnect();
  const cats = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
  return serialize(cats).map((c) => ({
    ...c,
    imageUrl: getPublicUrl(c.image),
  })) as unknown as PublicCategory[];
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  await dbConnect();
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) return null;
  return { ...serialize(cat), imageUrl: getPublicUrl(cat.image) } as unknown as PublicCategory;
}

/* ---------- Filters / facets ---------- */

export interface ProductFilters {
  brands: string[];
  multi: Record<string, number[]>; // numeric multi-select fields
  notes: Record<string, string[]>; // notes multi-select fields
  range: Record<string, { min?: number; max?: number }>;
}

export type FieldFacet =
  | { kind: "multi"; values: number[] }
  | { kind: "notes"; values: string[] }
  | { kind: "range"; min: number; max: number };

export interface Facets {
  brands: string[];
  fields: Record<string, FieldFacet>;
}

export type SortKey =
  | "order"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "date_desc"
  | "date_asc";

type SP = Record<string, string | string[] | undefined>;

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const parts = Array.isArray(v) ? v : v.split(",");
  return parts.map((s) => s.trim()).filter(Boolean);
}

export function parseFilters(productType: ProductType, sp: SP): ProductFilters {
  const filters: ProductFilters = { brands: toArray(sp.brand), multi: {}, notes: {}, range: {} };
  for (const f of PRODUCT_TYPE_FIELDS[productType]) {
    if (f.filter === "multi" && f.kind === "number") {
      filters.multi[f.key] = toArray(sp[`f_${f.key}`])
        .map(Number)
        .filter((n) => !Number.isNaN(n));
    } else if (f.filter === "multi" && f.kind === "notes") {
      filters.notes[f.key] = toArray(sp[`f_${f.key}`]);
    } else if (f.filter === "range") {
      const min = sp[`f_${f.key}_min`];
      const max = sp[`f_${f.key}_max`];
      filters.range[f.key] = {
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
      };
    }
  }
  return filters;
}

export function parseSort(sp: SP): SortKey {
  const s = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as SortKey | undefined;
  const allowed: SortKey[] = [
    "order",
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
    "date_desc",
    "date_asc",
  ];
  return s && allowed.includes(s) ? s : "order";
}

function computeFacets(productType: ProductType, products: PublicProduct[]): Facets {
  const brands = Array.from(
    new Set(products.map((p) => p.brand).filter((b): b is string => !!b)),
  ).sort((a, b) => a.localeCompare(b, "fa"));

  const fields: Record<string, FieldFacet> = {};
  for (const f of PRODUCT_TYPE_FIELDS[productType]) {
    if (f.filter === "multi" && f.kind === "number") {
      const values = Array.from(
        new Set(
          products
            .map((p) => p[f.key])
            .filter((v): v is number => typeof v === "number" && !Number.isNaN(v)),
        ),
      ).sort((a, b) => a - b);
      fields[f.key] = { kind: "multi", values };
    } else if (f.filter === "multi" && f.kind === "notes") {
      const values = Array.from(
        new Set(products.flatMap((p) => (Array.isArray(p[f.key]) ? p[f.key] : []))),
      ).sort((a: string, b: string) => a.localeCompare(b, "fa"));
      fields[f.key] = { kind: "notes", values };
    } else if (f.filter === "range") {
      const nums = products
        .map((p) => p[f.key])
        .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
      fields[f.key] = {
        kind: "range",
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
      };
    }
  }
  return { brands, fields };
}

function matchFilters(
  productType: ProductType,
  p: PublicProduct,
  filters: ProductFilters,
): boolean {
  if (filters.brands.length && !filters.brands.includes(p.brand)) return false;

  for (const f of PRODUCT_TYPE_FIELDS[productType]) {
    if (f.filter === "multi" && f.kind === "number") {
      const sel = filters.multi[f.key];
      if (sel?.length && !sel.includes(p[f.key])) return false;
    } else if (f.filter === "multi" && f.kind === "notes") {
      const sel = filters.notes[f.key];
      if (sel?.length) {
        const have: string[] = Array.isArray(p[f.key]) ? p[f.key] : [];
        if (!sel.some((s) => have.includes(s))) return false;
      }
    } else if (f.filter === "range") {
      const r = filters.range[f.key];
      const val = p[f.key];
      if (r?.min != null && (typeof val !== "number" || val < r.min)) return false;
      if (r?.max != null && (typeof val !== "number" || val > r.max)) return false;
    }
  }
  return true;
}

function sortProducts(products: PublicProduct[], sort: SortKey): PublicProduct[] {
  const arr = [...products];
  switch (sort) {
    case "name_asc":
      return arr.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    case "name_desc":
      return arr.sort((a, b) => b.title.localeCompare(a.title, "fa"));
    case "price_asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price_desc":
      return arr.sort((a, b) => b.price - a.price);
    case "date_desc":
      return arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "date_asc":
      return arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    default:
      return arr; // already sorted by manual order
  }
}

export interface CategoryProductsResult {
  items: PublicProduct[];
  total: number;
  totalPages: number;
  page: number;
  facets: Facets;
}

export async function getCategoryProducts(
  categoryId: string,
  productType: ProductType,
  opts: { filters: ProductFilters; sort: SortKey; page: number },
): Promise<CategoryProductsResult> {
  await dbConnect();
  const all = await Product.find({ category: categoryId })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  const allView = serialize(all).map(toProductView) as unknown as PublicProduct[];

  // Facets are computed from the full category set so all options stay visible.
  const facets = computeFacets(productType, allView);

  const filtered = sortProducts(
    allView.filter((p) => matchFilters(productType, p, opts.filters)),
    opts.sort,
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, opts.page), totalPages);
  const start = (page - 1) * PER_PAGE;
  const items = filtered.slice(start, start + PER_PAGE);

  return { items, total, totalPages, page, facets };
}
