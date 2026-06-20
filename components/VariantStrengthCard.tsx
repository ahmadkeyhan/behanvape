"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { subscribeToPush } from "@/lib/push-client";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Modal card for a variant attribute (juice nicotine / cartridge resistance):
 * shows one value at a time, chevrons to slide between values, availability state,
 * and a prominent per-value "notify me" button when the selected value is out of stock.
 */
export function VariantStrengthCard({
  productId,
  label,
  unit,
  variantKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options,
}: {
  productId: string;
  label: string;
  unit?: string;
  variantKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { available: boolean; [k: string]: any }[];
}) {
  const [idx, setIdx] = useState(0);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIdx(0);
    setNotified(new Set());
  }, [productId]);

  if (!options.length) return null;

  const count = options.length;
  const safeIdx = Math.min(idx, count - 1);
  const cur = options[safeIdx];
  const val = Number(cur[variantKey]);
  const multiple = count > 1;
  const done = notified.has(val);

  async function notify() {
    setNotifying(true);
    try {
      const endpoint = await subscribeToPush();
      await apiFetch("/api/notify-me", {
        method: "POST",
        body: JSON.stringify({ productId, subscriptionEndpoint: endpoint, variant: val }),
      });
      setNotified((prev) => new Set(prev).add(val));
      toast.success("ثبت شد!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت اعلان");
    } finally {
      setNotifying(false);
    }
  }

  return (
    <div className="col-span-2 rounded-lg border border-border bg-muted/40 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>

      <div className="mt-1 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!multiple}
          onClick={() => setIdx((safeIdx - 1 + count) % count)}
          aria-label="قبلی"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 flex-col items-center gap-1">
          <span>
            {formatNumber(val)}
            {unit ? ` ${unit}` : ""}
          </span>
          <Badge variant={cur.available ? "success" : "secondary"}>
            {cur.available ? "موجود" : "ناموجود"}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!multiple}
          onClick={() => setIdx((safeIdx + 1) % count)}
          aria-label="بعدی"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {multiple && (
        <div className="mt-2 flex justify-center gap-1" aria-hidden>
          {options.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === safeIdx ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      )}

      {!cur.available && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={notify}
          disabled={notifying || done}
          variant={done ? "secondary" : "default"}
        >
          {notifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : done ? (
            <Check className="h-4 w-4" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
          {done ? "ثبت شد" : "موجود شد خبرم کن"}
        </Button>
      )}
    </div>
  );
}
