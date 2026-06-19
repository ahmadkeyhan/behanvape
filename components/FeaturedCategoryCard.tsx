"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

// Large homepage feature card: full-bleed background image at a 2/1 aspect ratio
// with a dark gradient for legibility and a violet wash + zoom on hover.
export function FeaturedCategoryCard({
  href,
  image,
  title,
  subtitle,
}: {
  href: string;
  image: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className=" overflow-hidden rounded-3xl"
    >
      <Link
        href={href}
        className="group relative block aspect-[2/1] overflow-hidden rounded-3xl"
      >
        <Image
          src={image}
          alt={title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* legibility + brand wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 transition-colors duration-500 group-hover:bg-primary/20" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-10 sm:p-12">
          <div className="min-w-0">
            <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-3xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 line-clamp-1 text-sm text-white/75">{subtitle}</p>
            )}
            {/* <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium bg-primary py-2 px-3 rounded-full">
              مشاهده محصولات
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </span> */}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
