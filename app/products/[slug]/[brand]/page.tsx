import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getCategoryBySlug,
  getCategoryBrands,
  getCategoryProducts,
  parseFilters,
  parseSort,
} from "@/lib/public-data";
import { resolveBrandFromSlug } from "@/lib/brand-slug";
import { toFaDigits } from "@/lib/format";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterControls } from "@/components/catalog/FilterControls";
import { MobileFilters } from "@/components/catalog/MobileFilters";
import { SortControl } from "@/components/catalog/SortControl";
import { SearchControl } from "@/components/catalog/SearchControl";
import { Pagination } from "@/components/catalog/Pagination";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; brand: string }>;
}) {
  const { slug, brand: brandParam } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "محصولات" };
  if (brandParam === "all") return { title: category.title };
  const brands = await getCategoryBrands(category._id);
  const brandName = resolveBrandFromSlug(
    brands.map((b) => b.name),
    brandParam,
  );
  return { title: brandName ? `${brandName} | ${category.title}` : category.title };
}

export default async function CategoryBrandListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; brand: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug, brand: brandParam } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brands = await getCategoryBrands(category._id);
  const brandNames = brands.map((b) => b.name);

  let lockedBrand: string | null = null;
  if (brandParam !== "all") {
    lockedBrand = resolveBrandFromSlug(brandNames, brandParam);
    if (!lockedBrand) notFound();
  }

  const filters = parseFilters(category.productType, sp);
  if (lockedBrand) {
    filters.brands = [lockedBrand];
  }

  const sort = parseSort(sp);
  const pageNum = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const openProductId = Array.isArray(sp.product) ? sp.product[0] : sp.product;

  const { items, total, totalPages, page, facets } = await getCategoryProducts(
    category._id,
    category.productType,
    { filters, sort, page: pageNum },
  );

  const hideBrandFilter = !!lockedBrand;

  const activeCount =
    (hideBrandFilter ? 0 : filters.brands.length) +
    (filters.price.min != null || filters.price.max != null ? 1 : 0) +
    Object.values(filters.multi).reduce((a, v) => a + v.length, 0) +
    Object.values(filters.notes).reduce((a, v) => a + v.length, 0) +
    Object.values(filters.color).reduce((a, v) => a + v.length, 0) +
    Object.values(filters.range).filter((r) => r.min != null || r.max != null).length +
    Object.values(filters.bool).filter(Boolean).length;

  const brandLabel = lockedBrand ?? "همه";

  return (
    <main className="container py-6 sm:py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          خانه
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          محصولات
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <Link href={`/products/${category.slug}`} className="hover:text-foreground">
          {category.title}
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="text-foreground">{brandLabel}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {category.title}
          {lockedBrand ? (
            <span className="text-muted-foreground"> — {lockedBrand}</span>
          ) : null}
        </h1>
        {category.description && !lockedBrand && (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">فیلترها</h2>
            <FilterControls
              productType={category.productType}
              facets={facets}
              filters={filters}
              hideBrandFilter={hideBrandFilter}
            />
          </div>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <MobileFilters
                productType={category.productType}
                facets={facets}
                filters={filters}
                activeCount={activeCount}
                hideBrandFilter={hideBrandFilter}
              />
              <span className="text-sm text-muted-foreground">{toFaDigits(total)} محصول</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-md">
              <Suspense fallback={null}>
                <SearchControl value={filters.q} />
              </Suspense>
              <Suspense fallback={null}>
                <SortControl value={sort} />
              </Suspense>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {filters.q
                ? "نتیجه‌ای برای جستجو یافت نشد."
                : "محصولی با این فیلترها یافت نشد."}
            </p>
          ) : (
            <ProductGrid products={items} openProductId={openProductId} />
          )}

          <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </main>
  );
}
