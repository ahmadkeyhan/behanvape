"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PasswordTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("گذرواژهٔ جدید و تکرار آن یکسان نیستند.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success("گذرواژه با موفقیت تغییر کرد.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر گذرواژه");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>تغییر گذرواژهٔ مدیر</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur">گذرواژهٔ فعلی</Label>
            <Input
              id="cur"
              type="password"
              dir="ltr"
              className="text-start"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">گذرواژهٔ جدید</Label>
            <Input
              id="new"
              type="password"
              dir="ltr"
              className="text-start"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf">تکرار گذرواژهٔ جدید</Label>
            <Input
              id="conf"
              type="password"
              dir="ltr"
              className="text-start"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            تغییر گذرواژه
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
