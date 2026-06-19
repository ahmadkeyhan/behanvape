"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isSubscribed, pushSupported, subscribeToPush } from "@/lib/push-client";

export function NotificationCtaCard() {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setSupported(false);
      return;
    }
    isSubscribed().then(setOn);
  }, []);

  // Hide the CTA entirely on browsers that can't receive push.
  if (!supported) return null;

  async function enable() {
    if (busy || on) return;
    setBusy(true);
    try {
      await subscribeToPush();
      setOn(true);
      toast.success("اعلان‌ها فعال شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در فعال‌سازی اعلان‌ها");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div className="vapor-blob -end-10 -top-12 h-32 w-32 bg-primary/15" aria-hidden />
      <div className="relative flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-primary/15 p-3 text-primary">
          <BellRing className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold">از موجودی باخبر شوید</h3>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            با فعال‌سازی اعلان‌ها، به‌محض شارژ مجدد محصولات و اطلاع‌رسانی‌های ویژه باخبر می‌شوید.
          </p>
          <Button
            onClick={enable}
            disabled={busy || on}
            variant={on ? "secondary" : "default"}
            className="mt-4"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : on ? (
              <Check className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            {on ? "اعلان‌ها فعال است" : "فعال‌سازی اعلان‌ها"}
          </Button>
        </div>
      </div>
    </div>
  );
}
