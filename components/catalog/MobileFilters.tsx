"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterControls } from "@/components/catalog/FilterControls";
import type { ProductType } from "@/lib/product-types";
import type { Facets, ProductFilters } from "@/lib/public-data";

// Mobile: filters live in a bottom sheet; on desktop the sidebar is used instead.
export function MobileFilters({
  productType,
  facets,
  filters,
  activeCount,
}: {
  productType: ProductType;
  facets: Facets;
  filters: ProductFilters;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          فیلترها
          {activeCount > 0 && (
            <span className="ms-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="lg:hidden">
        <SheetHeader className="mb-4">
          <SheetTitle>فیلترها</SheetTitle>
        </SheetHeader>
        <FilterControls productType={productType} facets={facets} filters={filters} />
      </SheetContent>
    </Sheet>
  );
}
