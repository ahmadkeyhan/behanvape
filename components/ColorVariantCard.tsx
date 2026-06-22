"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscribeToPush } from "@/lib/push-client";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Modal card for color variants (vape/pod): lists every color as a swatch + name with its
 * availability. Out-of-stock colors get a per-color "notify me" button (keyed by hex).
 */
export function ColorVariantCard({
  productId,
  label,
  options,
}: {
  productId: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { available: boolean; color?: string; name?: string; [k: string]: any }[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNotified(new Set());
  }, [productId]);

  if (!options.length) return null;

  async function notify(hex: string) {
    setBusy(hex);
    try {
      const endpoint = await subscribeToPush();
      await apiFetch("/api/notify-me", {
        method: "POST",
        body: JSON.stringify({ productId, subscriptionEndpoint: endpoint, variant: hex }),
      });
      setNotified((prev) => new Set(prev).add(hex));
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
          const hex = String(o.color ?? "");
          const done = notified.has(hex);
          return (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-5 w-5 shrink-0 rounded-full border border-border",
                    !o.available && "opacity-40",
                  )}
                  style={{ backgroundColor: hex }}
                />
                <span
                  className={cn(
                    "text-sm",
                    !o.available && "text-muted-foreground line-through",
                  )}
                >
                  {o.name || hex}
                </span>
              </span>
              {o.available ? (
                <Badge variant="success">موجود</Badge>
              ) : (
                <Button
                  size="sm"
                  variant={done ? "secondary" : "default"}
                  disabled={busy === hex || done}
                  onClick={() => notify(hex)}
                >
                  {busy === hex ? (
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
