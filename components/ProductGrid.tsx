"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { apiFetch } from "@/lib/api-client";
import type { PublicProduct } from "@/lib/public-data";

export function ProductGrid({
  products,
  openProductId,
}: {
  products: PublicProduct[];
  openProductId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [open, setOpen] = useState(false);

  // Open a deep-linked product (e.g. from a restock push) — look it up locally or fetch it.
  useEffect(() => {
    if (!openProductId) return;
    const local = products.find((p) => p._id === openProductId);
    if (local) {
      setSelected(local);
      setOpen(true);
      return;
    }
    apiFetch<PublicProduct>(`/api/products/${openProductId}`)
      .then((p) => {
        setSelected(p);
        setOpen(true);
      })
      .catch(() => undefined);
  }, [openProductId, products]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get("product")) {
      // Drop the ?product= param on close for a clean URL.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("product");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onClick={() => {
              setSelected(p);
              setOpen(true);
            }}
          />
        ))}
      </div>
      <ProductDetailModal product={selected} open={open} onOpenChange={handleOpenChange} />
    </>
  );
}
