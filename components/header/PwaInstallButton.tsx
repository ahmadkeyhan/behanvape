"use client";

import { Download, Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const { canInstall, promptInstall, installed, isIOS } = usePwaInstall();

  if (installed) return null;

  // iOS doesn't fire beforeinstallprompt — guide the user instead.
  if (!canInstall && isIOS) {
    const onIOSHint = () =>
      toast("برای نصب: دکمهٔ اشتراک‌گذاری سپس «افزودن به صفحهٔ اصلی» را بزنید.", {
        icon: <Share className="h-4 w-4" />,
      });
    if (compact) {
      return (
        <Button variant="ghost" size="icon" onClick={onIOSHint} aria-label="نصب اپلیکیشن">
          <Download className="h-5 w-5" />
        </Button>
      );
    }
    return (
      <button
        type="button"
        onClick={onIOSHint}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-base font-medium"
      >
        <Download className="h-5 w-5 text-primary" />
        نصب اپلیکیشن
      </button>
    );
  }

  if (!canInstall) return null;

  if (compact) {
    return (
      <Button variant="ghost" size="icon" onClick={promptInstall} aria-label="نصب اپلیکیشن">
        <Download className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-base font-medium"
    >
      <Download className="h-5 w-5 text-primary" />
      نصب اپلیکیشن
    </button>
  );
}
