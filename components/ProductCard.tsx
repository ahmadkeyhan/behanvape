"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { PublicProduct } from "@/lib/public-data";

export function ProductCard({
  product,
  onClick,
}: {
  product: PublicProduct;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.imageUrls?.[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            بدون تصویر
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Badge variant="secondary">ناموجود</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
        <h3 className="line-clamp-2 text-sm font-medium leading-6">{product.title}</h3>
        <div className="mt-auto pt-2">
          {product.available ? (
            <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">به‌زودی موجود می‌شود</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
