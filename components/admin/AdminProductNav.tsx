"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TAB =
  "inline-flex h-9 items-center justify-center rounded-full border border-border bg-transparent px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground";
const ACTIVE =
  "border-transparent bg-[image:var(--grad-primary)] text-primary-foreground hover:border-transparent hover:text-primary-foreground";

/** Shared chip nav for admin product hub pages (products route is current). */
export function AdminProductNav() {
  return (
    <nav className="mb-6 flex flex-wrap justify-start gap-2" dir="rtl">
      <Link href="/admin/products" className={cn(TAB, ACTIVE)}>
        محصولات
      </Link>
      <Link href="/admin" className={TAB}>
        دسته‌بندی‌ها
      </Link>
      <Link href="/admin?tab=users" className={TAB}>
        کاربران
      </Link>
      <Link href="/admin?tab=password" className={TAB}>
        گذرواژه
      </Link>
      <Link href="/admin?tab=notifications" className={TAB}>
        اعلان‌ها
      </Link>
    </nav>
  );
}
