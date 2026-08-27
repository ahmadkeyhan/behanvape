import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/require-admin";
import { getCategories, getCategoryBySlug, getCategoryBrands } from "@/lib/public-data";
import { resolveBrandFromSlug } from "@/lib/brand-slug";
import { AdminProductList } from "@/components/admin/AdminProductList";
import { AdminProductNav } from "@/components/admin/AdminProductNav";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; brand: string }>;
}) {
  const { slug, brand: brandParam } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "مدیریت محصولات" };
  if (brandParam === "all") return { title: `مدیریت | ${category.title}` };
  const brands = await getCategoryBrands(category._id);
  const brandName = resolveBrandFromSlug(
    brands.map((b) => b.name),
    brandParam,
  );
  return {
    title: brandName
      ? `مدیریت | ${brandName} | ${category.title}`
      : `مدیریت | ${category.title}`,
  };
}

export default async function AdminCategoryBrandManagePage({
  params,
}: {
  params: Promise<{ slug: string; brand: string }>;
}) {
  await requireAdmin();
  const { slug, brand: brandParam } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brands = await getCategoryBrands(category._id);
  const brandNames = brands.map((b) => b.name);

  let lockedBrand: string | null = null;
  if (brandParam !== "all") {
    lockedBrand = resolveBrandFromSlug(brandNames, brandParam);
    if (!lockedBrand) notFound();
  }

  const allCategories = await getCategories();
  const brandLabel = lockedBrand ?? "همه";

  return (
    <main className="container py-6 sm:py-8">
      <AdminProductNav />

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          پنل مدیریت
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <Link href="/admin/products" className="hover:text-foreground">
          محصولات
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <Link href={`/admin/products/${category.slug}`} className="hover:text-foreground">
          {category.title}
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="text-foreground">{brandLabel}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {category.title}
          {lockedBrand ? ` — ${lockedBrand}` : " — همه"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">ویرایش، ترتیب و موجودی محصولات</p>
      </div>

      <Suspense fallback={null}>
        <AdminProductList
          categoryId={category._id}
          productType={category.productType}
          brandName={lockedBrand}
          categories={allCategories.map((c) => ({
            _id: c._id,
            title: c.title,
            productType: c.productType,
          }))}
        />
      </Suspense>
    </main>
  );
}
