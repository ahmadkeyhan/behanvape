"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import { toFaDigits } from "@/lib/format";

export function BrandCard({
  href,
  title,
  count,
  imageUrl,
  all,
}: {
  href: string;
  title: string;
  count?: number;
  imageUrl?: string;
  /** Visual variant for the "همه" card */
  all?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        href={href}
        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              {all ? <LayoutGrid className="h-8 w-8 text-primary" /> : null}
              <span className="text-sm">{all ? "همهٔ برندها" : "بدون تصویر"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{title}</h3>
            {typeof count === "number" && (
              <p className="mt-1 text-sm text-muted-foreground">
                {toFaDigits(count)} محصول
              </p>
            )}
          </div>
          <ChevronLeft className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
        </div>
      </Link>
    </motion.div>
  );
}
