import { getCategories } from "@/lib/public-data";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { CategoryCard } from "@/components/CategoryCard";

// Catalogue reflects the live DB on each request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <>
      <SiteHeader />
      <Hero />
      <main className="container py-10 sm:py-12">
        <h2 className="mb-6 text-xl font-bold sm:text-2xl">دسته‌بندی‌ها</h2>
        {categories.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">به‌زودی محصولات اضافه می‌شوند.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((c) => (
              <CategoryCard key={c._id} category={c} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
