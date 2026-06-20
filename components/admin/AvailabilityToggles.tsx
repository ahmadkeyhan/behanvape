"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getVariantField } from "@/lib/product-types";

/**
 * Availability control reused by the admin product list and the cashier board.
 * Variant types (juice/cartridge) show one switch per value; others show a single switch.
 * Each toggle PATCHes /api/products/[id]/availability (per-variant fires that strength's restock push).
 */
export function AvailabilityToggles({
  product,
  onAvailableChange,
}: {
  // admin product objects are loosely-typed (Record<string, any>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  onAvailableChange?: (available: boolean) => void;
}) {
  const vf = getVariantField(product.productType);
  const vk = vf?.variantKey ?? "value";

  const [options, setOptions] = useState<{ value: number; available: boolean }[]>(() =>
    vf && Array.isArray(product[vf.key])
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        product[vf.key].map((o: any) => ({ value: o?.[vk], available: o?.available !== false }))
      : [],
  );
  const [whole, setWhole] = useState<boolean>(product.available);
  const [busy, setBusy] = useState(false);

  async function patch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    optimistic: () => void,
    revert: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    optimistic();
    try {
      await apiFetch(`/api/products/${product._id}/availability`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } catch (err) {
      revert();
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy(false);
    }
  }

  if (vf) {
    if (options.length === 0) {
      return <span className="text-xs text-muted-foreground">بدون گزینه</span>;
    }
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        {options.map((o, i) => (
          <label key={i} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground" dir="ltr">
              {o.value}
              {vf.unit ? ` ${vf.unit}` : ""}
            </span>
            <Switch
              checked={o.available}
              disabled={busy}
              aria-label={`وضعیت ${o.value}`}
              onCheckedChange={(c) => {
                const prev = options;
                const next = options.map((x, j) => (j === i ? { ...x, available: c } : x));
                patch(
                  { variant: o.value, available: c },
                  () => {
                    setOptions(next);
                    onAvailableChange?.(next.some((x) => x.available));
                  },
                  () => {
                    setOptions(prev);
                    onAvailableChange?.(prev.some((x) => x.available));
                  },
                );
              }}
            />
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={whole ? "success" : "secondary"} className="hidden sm:inline-flex">
        {whole ? "موجود" : "ناموجود"}
      </Badge>
      <Switch
        checked={whole}
        disabled={busy}
        aria-label="وضعیت موجودی"
        onCheckedChange={(c) =>
          patch(
            { available: c },
            () => {
              setWhole(c);
              onAvailableChange?.(c);
            },
            () => {
              setWhole(!c);
              onAvailableChange?.(!c);
            },
          )
        }
      />
    </div>
  );
}
