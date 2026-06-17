"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface HeaderCategory {
  _id: string;
  title: string;
  slug: string;
}

export function ProductsMenu({
  categories,
  variant,
  onNavigate,
}: {
  categories: HeaderCategory[];
  variant: "dropdown" | "list";
  /** called when a link is tapped (used to close the mobile sheet) */
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true);

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none">
          محصولات
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem asChild>
            <Link href="/products">همهٔ محصولات</Link>
          </DropdownMenuItem>
          {categories.length > 0 && <DropdownMenuSeparator />}
          {categories.map((c) => (
            <DropdownMenuItem key={c._id} asChild>
              <Link href={`/products/${c.slug}`}>{c.title}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // mobile "list" variant — collapsible section
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-base font-medium"
      >
        <span className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          محصولات
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="space-y-0.5 pb-1 pe-2 ps-9">
          <li>
            <Link
              href="/products"
              onClick={onNavigate}
              className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              همهٔ محصولات
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                href={`/products/${c.slug}`}
                onClick={onNavigate}
                className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
