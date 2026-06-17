"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  isSubscribed,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

export function NotificationToggle({ compact = false }: { compact?: boolean }) {
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

  async function toggle(next: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (next) {
        await subscribeToPush();
        setOn(true);
        toast.success("اعلان‌ها فعال شد.");
      } else {
        await unsubscribeFromPush();
        setOn(false);
        toast.success("اعلان‌ها غیرفعال شد.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت اعلان‌ها");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    if (compact) return null;
    return (
      <div className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <BellOff className="h-5 w-5" />
          اعلان‌ها
        </span>
        <span className="text-xs">پشتیبانی نمی‌شود</span>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggle(!on)}
        disabled={busy}
        aria-label={on ? "غیرفعال‌سازی اعلان‌ها" : "فعال‌سازی اعلان‌ها"}
        title={on ? "اعلان‌ها فعال است" : "فعال‌سازی اعلان‌ها"}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : on ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md px-2 py-2">
      <span className="flex items-center gap-2 text-base font-medium">
        {on ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        اعلان‌ها
      </span>
      <Switch checked={on} onCheckedChange={toggle} disabled={busy} aria-label="وضعیت اعلان‌ها" />
    </div>
  );
}
