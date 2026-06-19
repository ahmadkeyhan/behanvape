"use client";

import { Download, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function InstallCtaCard() {
  const { canInstall, promptInstall, installed, isIOS } = usePwaInstall();

  // Already installed -> no need to nag.
  if (installed) return null;

  function onClick() {
    if (canInstall) {
      promptInstall();
      return;
    }
    if (isIOS) {
      toast("برای نصب: دکمهٔ اشتراک‌گذاری سپس «افزودن به صفحهٔ اصلی» را بزنید.", {
        icon: <Share className="h-4 w-4" />,
      });
      return;
    }
    toast("از منوی مرورگر گزینهٔ «نصب برنامه» / «Add to Home screen» را انتخاب کنید.");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div className="vapor-blob -end-10 -top-12 h-32 w-32 bg-primary/15" aria-hidden />
      <div className="relative flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-primary/15 p-3 text-primary">
          <Smartphone className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold">نصب اپلیکیشن بهان‌ویپ</h3>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            برای دسترسی سریع‌تر و تجربهٔ بهتر، اپ را روی صفحهٔ اصلی دستگاه خود نصب کنید.
          </p>
          <Button onClick={onClick} className="mt-4">
            <Download className="h-4 w-4" />
            نصب اپلیکیشن
          </Button>
        </div>
      </div>
    </div>
  );
}
