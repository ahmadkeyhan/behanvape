import { getCategories } from "@/lib/public-data";
import { Hero } from "@/components/Hero";
import { FeaturedCategoryCard } from "@/components/FeaturedCategoryCard";
import { InstallCtaCard } from "@/components/home/InstallCtaCard";
import { NotificationCtaCard } from "@/components/home/NotificationCtaCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Catalogue reflects the live DB on each request.
export const dynamic = "force-dynamic";

// Two curated homepage cards. Each resolves to a real category (by slug/title) so
// the link + heading stay correct — edit `match`/`fallbackSlug`/`label` if your
// category slugs differ from these.
const FEATURED = [
  { label: "ویپ", image: "/vape.jpg", match: ["vape", "ویپ"], fallbackSlug: "vape" },
  { label: "پاد", image: "/pod.jpg", match: ["pod", "پاد"], fallbackSlug: "pod" },
  { label: "سالت نیکوتین", image: "/salt.jpg", match: ["salt", "سالت نیکوتین"], fallbackSlug: "salt" },
  { label: "آیکاس", image: "/iqos.jpg", match: ["iqos", "آیکاس"], fallbackSlug: "iqos" },
];

export default async function HomePage() {
  const categories = await getCategories();

  const cards = FEATURED.map((f) => {
    const cat =
      // prefer an exact slug/title match, then fall back to a partial title match
      categories.find((c) => f.match.includes(c.slug) || f.match.includes(c.title.trim())) ??
      categories.find((c) => f.match.some((m) => c.title.includes(m)));
    return {
      image: f.image,
      title: cat?.title ?? f.label,
      subtitle: cat?.description || undefined,
      href: `/products/${cat?.slug ?? f.fallbackSlug}`,
    };
  });

  return (
    <>
      <Hero />
      <main className="container py-10 sm:py-12">
        <h2 className="mb-6 text-xl font-bold sm:text-2xl">دسته‌بندی‌ها</h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {cards.map((c) => (
            <FeaturedCategoryCard
              key={c.image}
              href={c.href}
              image={c.image}
              title={c.title}
              subtitle={c.subtitle}
            />
          ))}
          <Button asChild size="lg" className="sm:col-span-2">
            <Link href="/products">
              مشاهده‌ی تمام محصولات
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
          <InstallCtaCard />
          <NotificationCtaCard />
        </section>
      </main>
    </>
  );
}
