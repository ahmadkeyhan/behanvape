import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/require-admin";
import { getCategoryBySlug, getCategoryBrands } from "@/lib/public-data";
import { BrandCard } from "@/components/BrandCard";
import { AdminProductNav } from "@/components/admin/AdminProductNav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? `مدیریت | ${category.title}` : "مدیریت محصولات" };
}

export default async function AdminCategoryBrandHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brands = await getCategoryBrands(category._id);
  const totalCount = brands.reduce((sum, b) => sum + b.count, 0);

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
        <span className="text-foreground">{category.title}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{category.title}</h1>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">برند را انتخاب کنید</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        <BrandCard
          href={`/admin/products/${category.slug}/all`}
          title="همه"
          count={totalCount}
          imageUrl={category.imageUrl}
          all
        />
        {brands.map((b) => (
          <BrandCard
            key={b.slug}
            href={`/admin/products/${category.slug}/${b.slug}`}
            title={b.name}
            count={b.count}
            imageUrl={b.imageUrl}
          />
        ))}
      </div>

      {brands.length === 0 && (
        <p className="mt-8 py-8 text-center text-muted-foreground">
          هنوز برندی در این دسته ثبت نشده است. از «همه» همهٔ محصولات را مدیریت کنید.
        </p>
      )}
    </main>
  );
}
