"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { AvailabilityToggles } from "@/components/admin/AvailabilityToggles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryItem {
  _id: string;
  title: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductItem = Record<string, any> & {
  _id: string;
  title: string;
  price: number;
  available: boolean;
  imageUrls: string[];
  category: { _id: string; title: string } | string;
};

// Cashier view: a single flat product list with ONLY availability toggles. No other controls.
export function CashierBoard() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<CategoryItem[]>("/api/categories"),
      apiFetch<ProductItem[]>("/api/products"),
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => {
      const catId = typeof p.category === "string" ? p.category : p.category?._id;
      return catId === filter;
    });
  }, [products, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">وضعیت موجودی محصولات</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همهٔ دسته‌ها</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">محصولی یافت نشد.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li
              key={p._id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.imageUrls?.[0] && (
                  <Image
                    src={p.imageUrls[0]}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
              </div>
              <AvailabilityToggles product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
