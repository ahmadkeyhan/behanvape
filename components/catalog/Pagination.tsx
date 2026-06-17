"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

// URL-based pagination (?page=N) so each page is shareable/bookmarkable.
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(sp.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Compact window of page numbers around the current page.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="صفحه‌بندی">
      <PageLink href={href(page - 1)} disabled={page <= 1} ariaLabel="قبلی">
        {/* In RTL, "previous" points to the right */}
        <ChevronRight className="h-4 w-4" />
      </PageLink>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          scroll={false}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm",
            p === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-accent",
          )}
        >
          {toFaDigits(p)}
        </Link>
      ))}
      <PageLink href={href(page + 1)} disabled={page >= totalPages} ariaLabel="بعدی">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-label={ariaLabel}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground opacity-40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
    >
      {children}
    </Link>
  );
}
