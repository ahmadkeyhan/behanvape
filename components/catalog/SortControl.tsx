"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS: { value: string; label: string }[] = [
  { value: "order", label: "پیش‌فرض" },
  { value: "date_desc", label: "جدیدترین" },
  { value: "date_asc", label: "قدیمی‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "name_asc", label: "نام (الف-ی)" },
  { value: "name_desc", label: "نام (ی-الف)" },
];

export function SortControl({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(sp.toString());
    if (next === "order") params.delete("sort");
    else params.set("sort", next);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
