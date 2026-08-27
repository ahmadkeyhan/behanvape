import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/require-admin";
import { getCategories } from "@/lib/public-data";
import { CategoryCard } from "@/components/CategoryCard";
import { AdminProductNav } from "@/components/admin/AdminProductNav";

export const dynamic = "force-dynamic";

export const metadata = { title: "مدیریت محصولات" };

export default async function AdminProductsIndexPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <main className="container py-6 sm:py-8">
      <AdminProductNav />

      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          پنل مدیریت
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="text-foreground">محصولات</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">مدیریت محصولات</h1>
      <p className="mb-6 text-sm text-muted-foreground">دسته را انتخاب کنید</p>

      {categories.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          ابتدا از پنل مدیریت یک دسته بسازید.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c._id} category={c} href={`/admin/products/${c.slug}`} />
          ))}
        </div>
      )}
    </main>
  );
}
