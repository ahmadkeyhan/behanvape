"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { toFaDigits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CategoryItem {
  _id: string;
  title: string;
  slug: string;
}
interface LogItem {
  _id: string;
  title: string;
  body: string;
  targetRoute: string;
  sentCount: number;
  createdAt: string;
}

export function NotificationsTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("/");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [sending, setSending] = useState(false);

  async function loadLogs() {
    try {
      setLogs(await apiFetch<LogItem[]>("/api/notifications"));
    } catch {
      /* non-critical */
    }
  }

  useEffect(() => {
    apiFetch<CategoryItem[]>("/api/categories")
      .then(setCategories)
      .catch(() => undefined);
    loadLogs();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان اعلان را وارد کنید.");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch<{ sentCount: number; total: number }>(
        "/api/notifications/send",
        { method: "POST", body: JSON.stringify({ title, body, targetRoute: target }) },
      );
      toast.success(`اعلان به ${toFaDigits(res.sentCount)} دستگاه ارسال شد.`);
      setTitle("");
      setBody("");
      await loadLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ارسال اعلان");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>ارسال اعلان همگانی</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n-title">عنوان</Label>
              <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-body">متن</Label>
              <Textarea id="n-body" value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>مقصد</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/">صفحهٔ اصلی</SelectItem>
                  <SelectItem value="/products">همهٔ دسته‌ها</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={`/products/${c.slug}`}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              ارسال
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ارسال‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">هنوز اعلانی ارسال نشده است.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>تعداد</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l._id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>{toFaDigits(l.sentCount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
