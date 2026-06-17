"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/lib/push-client";

// Optional general "enable notifications" control (shares the same subscribe helper as notify-me).
export function NotificationBell() {
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    try {
      await subscribeToPush();
      toast.success("اعلان‌ها فعال شد. از تخفیف‌ها و محصولات تازه باخبر می‌شوید.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فعال‌سازی اعلان‌ها ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={enable}
      disabled={busy}
      aria-label="فعال‌سازی اعلان‌ها"
    >
      <Bell className="h-5 w-5" />
    </Button>
  );
}
