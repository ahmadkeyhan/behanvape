import { getCategories } from "@/lib/public-data";
import { CategoryCard } from "@/components/CategoryCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "محصولات" };

export default async function AllCategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <main className="container py-8 sm:py-10">
        <h1 className="mb-6 text-2xl font-bold">دسته‌بندی محصولات</h1>
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
    </>
  );
}
