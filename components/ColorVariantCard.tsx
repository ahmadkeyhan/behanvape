"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscribeToPush } from "@/lib/push-client";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type ColorOption = {
  available: boolean;
  color?: string;
  name?: string;
  image?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

/**
 * Modal card for color/named image variants: lists every option with availability.
 * Out-of-stock options get a per-option "notify me" button (keyed by color hex or name).
 * Tapping the row can jump the gallery to that option's linked image.
 */
export function ColorVariantCard({
  productId,
  label,
  options,
  onSelectColor,
  /** Identity field on each option used for notify + keys. Default: color (hex). */
  identityKey = "color",
  showSwatch = true,
}: {
  productId: string;
  label: string;
  options: ColorOption[];
  onSelectColor?: (option: ColorOption) => void;
  identityKey?: string;
  showSwatch?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNotified(new Set());
  }, [productId]);

  if (!options.length) return null;

  async function notify(id: string) {
    setBusy(id);
    try {
      const endpoint = await subscribeToPush();
      await apiFetch("/api/notify-me", {
        method: "POST",
        body: JSON.stringify({ productId, subscriptionEndpoint: endpoint, variant: id }),
      });
      setNotified((prev) => new Set(prev).add(id));
      toast.success("ثبت شد!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت اعلان");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="col-span-2 rounded-lg border border-border bg-muted/40 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <ul className="mt-2 flex flex-col gap-2">
        {options.map((o, i) => {
          const id = String(o[identityKey] ?? o.name ?? i);
          const done = notified.has(id);
          return (
            <li key={i} className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectColor?.(o)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-start transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showSwatch && (
                  <span
                    className={cn(
                      "h-5 w-5 shrink-0 rounded-full border border-border",
                      !o.available && "opacity-40",
                    )}
                    style={{ backgroundColor: String(o.color ?? "") }}
                  />
                )}
                <span
                  className={cn(
                    "truncate text-sm",
                    !o.available && "text-muted-foreground line-through",
                  )}
                >
                  {o.name || id}
                </span>
              </button>
              {o.available ? (
                <Badge variant="success">موجود</Badge>
              ) : (
                <Button
                  size="sm"
                  variant={done ? "secondary" : "default"}
                  disabled={busy === id || done}
                  onClick={() => notify(id)}
                >
                  {busy === id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <BellRing className="h-4 w-4" />
                  )}
                  {done ? "ثبت شد" : "خبرم کن"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
