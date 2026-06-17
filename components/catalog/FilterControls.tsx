"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";
import type { Facets, ProductFilters } from "@/lib/public-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  function setRange(key: string, which: "min" | "max", value: string) {
    const next = new URLSearchParams(sp.toString());
    const pk = `f_${key}_${which}`;
    if (value) next.set(pk, value);
    else next.delete(pk);
    commit(next);
  }

  function clearAll() {
    const next = new URLSearchParams();
    const sort = sp.get("sort");
    if (sort) next.set("sort", sort);
    commit(next);
  }

  const hasAnyFacet =
    facets.brands.length > 0 ||
    fields.some((f) => {
      const ff = facets.fields[f.key];
      if (!ff) return false;
      if (ff.kind === "range") return ff.max > 0;
      return ff.values.length > 0;
    });

  if (!hasAnyFacet) {
    return <p className="text-sm text-muted-foreground">فیلتری برای این دسته موجود نیست.</p>;
  }

  return (
    <div className="space-y-6">
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

        if (facet.kind === "range") {
          if (facet.max <= 0) return null;
          const r = filters.range[f.key] || {};
          return (
            <section key={f.key} className="space-y-2">
              <h3 className="text-sm font-semibold">
                {f.label}
                {f.unit ? ` (${f.unit})` : ""}
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={`از ${facet.min}`}
                  defaultValue={r.min ?? ""}
                  onBlur={(e) => setRange(f.key, "min", e.target.value)}
                  className="h-9"
                />
                <span className="text-muted-foreground">تا</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={`تا ${facet.max}`}
                  defaultValue={r.max ?? ""}
                  onBlur={(e) => setRange(f.key, "max", e.target.value)}
                  className="h-9"
                />
              </div>
            </section>
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
