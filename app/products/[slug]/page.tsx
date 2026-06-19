import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getCategoryBySlug,
  getCategoryProducts,
  parseFilters,
  parseSort,
} from "@/lib/public-data";
import { toFaDigits } from "@/lib/format";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterControls } from "@/components/catalog/FilterControls";
import { MobileFilters } from "@/components/catalog/MobileFilters";
import { SortControl } from "@/components/catalog/SortControl";
import { Pagination } from "@/components/catalog/Pagination";

// Rendered on-demand (never statically generated, no generateStaticParams), so
// categories created after the build resolve immediately without a rebuild/redeploy.
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.title ?? "محصولات" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseFilters(category.productType, sp);
  const sort = parseSort(sp);
  const pageNum = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const openProductId = Array.isArray(sp.product) ? sp.product[0] : sp.product;

  const { items, total, totalPages, page, facets } = await getCategoryProducts(
    category._id,
    category.productType,
    { filters, sort, page: pageNum },
  );

  const activeCount =
    filters.brands.length +
    (filters.price.min != null || filters.price.max != null ? 1 : 0) +
    Object.values(filters.multi).reduce((a, v) => a + v.length, 0) +
    Object.values(filters.notes).reduce((a, v) => a + v.length, 0) +
    Object.values(filters.range).filter((r) => r.min != null || r.max != null).length +
    Object.values(filters.bool).filter(Boolean).length;

  return (
    <>
      <main className="container py-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            خانه
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            محصولات
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">{category.title}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{category.title}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-4 font-semibold">فیلترها</h2>
              <FilterControls productType={category.productType} facets={facets} filters={filters} />
            </div>
          </aside>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <MobileFilters
                  productType={category.productType}
                  facets={facets}
                  filters={filters}
                  activeCount={activeCount}
                />
                <span className="text-sm text-muted-foreground">{toFaDigits(total)} محصول</span>
              </div>
              <SortControl value={sort} />
            </div>

            {items.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">
                محصولی با این فیلترها یافت نشد.
              </p>
            ) : (
              <ProductGrid products={items} openProductId={openProductId} />
            )}

            <Pagination page={page} totalPages={totalPages} />
          </div>
        </div>
      </main>
    </>
  );
}
