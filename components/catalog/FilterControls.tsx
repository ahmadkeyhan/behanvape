"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";
import type { Facets, ProductFilters } from "@/lib/public-data";
import { Button } from "@/components/ui/button";
import { RangeSlider } from "@/components/ui/range-slider";
import { cn } from "@/lib/utils";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

// Step that gives ~100 increments and handles decimal-valued fields (e.g. resistance).
function rangeStep(min: number, max: number): number {
  const span = max - min;
  const decimal = !Number.isInteger(min) || !Number.isInteger(max);
  if (decimal) return span >= 5 ? 0.1 : 0.01;
  if (span <= 200) return 1;
  return Math.max(1, Math.round(span / 100));
}

function RangeFilterField({
  label,
  unit,
  min,
  max,
  valueMin,
  valueMax,
  onCommit,
}: {
  label: string;
  unit?: string;
  min: number;
  max: number;
  valueMin?: number;
  valueMax?: number;
  onCommit: (values: [number, number]) => void;
}) {
  const step = rangeStep(min, max);
  const [vals, setVals] = useState<[number, number]>([valueMin ?? min, valueMax ?? max]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {label}
          {unit ? ` (${unit})` : ""}
        </h3>
        <span dir="ltr" className="text-xs text-muted-foreground">
          {formatNumber(vals[0])} – {formatNumber(vals[1])}
        </span>
      </div>
      <RangeSlider
        min={min}
        max={max}
        step={step}
        value={vals}
        onValueChange={setVals}
        onValueCommit={onCommit}
      />
    </section>
  );
}

export function FilterControls({
  productType,
  facets,
  filters,
}: {
  productType: ProductType;
  facets: Facets;
  filters: ProductFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const fields = PRODUCT_TYPE_FIELDS[productType];

  function commit(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggleCsv(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    const cur = (next.get(key) || "").split(",").map((s) => s.trim()).filter(Boolean);
    const idx = cur.indexOf(value);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(value);
    if (cur.length) next.set(key, cur.join(","));
    else next.delete(key);
    commit(next);
  }

  // Writes both bounds; a bound equal to the facet edge is omitted (= "no limit") to keep URLs clean.
  function commitRange(
    minKey: string,
    maxKey: string,
    values: [number, number],
    boundMin: number,
    boundMax: number,
  ) {
    const next = new URLSearchParams(sp.toString());
    const [vMin, vMax] = values;
    if (vMin > boundMin) next.set(minKey, String(vMin));
    else next.delete(minKey);
    if (vMax < boundMax) next.set(maxKey, String(vMax));
    else next.delete(maxKey);
    commit(next);
  }

  function setBool(key: string, on: boolean) {
    const next = new URLSearchParams(sp.toString());
    if (on) next.set(`f_${key}`, "1");
    else next.delete(`f_${key}`);
    commit(next);
  }

  function clearAll() {
    const next = new URLSearchParams();
    const sort = sp.get("sort");
    if (sort) next.set("sort", sort);
    commit(next);
  }

  const hasPriceFacet = facets.price.max > facets.price.min;

  const hasAnyFacet =
    hasPriceFacet ||
    facets.brands.length > 0 ||
    fields.some((f) => {
      const ff = facets.fields[f.key];
      if (!ff) return false;
      if (ff.kind === "range") return ff.max > ff.min;
      if (ff.kind === "boolean") return ff.trueCount > 0 && ff.falseCount > 0;
      return ff.values.length > 0;
    });

  if (!hasAnyFacet) {
    return <p className="text-sm text-muted-foreground">فیلتری برای این دسته موجود نیست.</p>;
  }

  return (
    <div className="space-y-6">
      {hasPriceFacet && (
        <RangeFilterField
          key={`price-${filters.price.min ?? ""}-${filters.price.max ?? ""}`}
          label="قیمت"
          unit="تومان"
          min={facets.price.min}
          max={facets.price.max}
          valueMin={filters.price.min}
          valueMax={filters.price.max}
          onCommit={(v) =>
            commitRange("price_min", "price_max", v, facets.price.min, facets.price.max)
          }
        />
      )}

      {facets.brands.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">برند</h3>
          <div className="flex flex-wrap gap-2">
            {facets.brands.map((b) => (
              <Chip key={b} active={filters.brands.includes(b)} onClick={() => toggleCsv("brand", b)}>
                {b}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {fields.map((f) => {
        const facet = facets.fields[f.key];
        if (!facet) return null;

        if (facet.kind === "boolean") {
          // only useful when the category has a mix of with/without
          if (facet.trueCount === 0 || facet.falseCount === 0) return null;
          return (
            <section key={f.key} className="space-y-2">
              <h3 className="text-sm font-semibold">{f.label}</h3>
              <Chip active={!!filters.bool[f.key]} onClick={() => setBool(f.key, !filters.bool[f.key])}>
                دارد
              </Chip>
            </section>
          );
        }

        if (facet.kind === "range") {
          if (facet.max <= facet.min) return null;
          const r = filters.range[f.key] || {};
          return (
            <RangeFilterField
              key={`${f.key}-${r.min ?? ""}-${r.max ?? ""}`}
              label={f.label}
              unit={f.unit}
              min={facet.min}
              max={facet.max}
              valueMin={r.min}
              valueMax={r.max}
              onCommit={(v) =>
                commitRange(`f_${f.key}_min`, `f_${f.key}_max`, v, facet.min, facet.max)
              }
            />
          );
        }

        if (facet.values.length === 0) return null;
        const paramKey = `f_${f.key}`;
        return (
          <section key={f.key} className="space-y-2">
            <h3 className="text-sm font-semibold">{f.label}</h3>
            <div className="flex flex-wrap gap-2">
              {facet.kind === "multi"
                ? facet.values.map((v) => (
                    <Chip
                      key={v}
                      active={(filters.multi[f.key] || []).includes(v)}
                      onClick={() => toggleCsv(paramKey, String(v))}
                    >
                      {formatNumber(v)}
                      {f.unit ? ` ${f.unit}` : ""}
                    </Chip>
                  ))
                : facet.values.map((v) => (
                    <Chip
                      key={v}
                      active={(filters.notes[f.key] || []).includes(v)}
                      onClick={() => toggleCsv(paramKey, v)}
                    >
                      {v}
                    </Chip>
                  ))}
            </div>
          </section>
        );
      })}

      <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
        حذف همهٔ فیلترها
      </Button>
    </div>
  );
}
