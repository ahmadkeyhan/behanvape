"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { PublicCategory } from "@/lib/public-data";

export function CategoryCard({ category }: { category: PublicCategory }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        href={`/products/${category.slug}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.title}
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
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{category.title}</h3>
            {category.description && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
          <ChevronLeft className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
        </div>
      </Link>
    </motion.div>
  );
}
