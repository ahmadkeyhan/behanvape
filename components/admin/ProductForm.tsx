"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import {
  getProductFormSchema,
  formToPayload,
  type ProductFormValues,
} from "@/lib/product-schemas";
import { PRODUCT_TYPE_FIELDS, type ProductType } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagesField } from "@/components/admin/ImageUploader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductLike = Record<string, any>;

export function ProductForm({
  productType,
  categories,
  defaultCategoryId,
  initial,
  onSaved,
}: {
  productType: ProductType;
  categories: { _id: string; title: string }[];
  defaultCategoryId: string;
  initial?: ProductLike | null;
  onSaved: () => void;
}) {
  const fields = PRODUCT_TYPE_FIELDS[productType];

  const defaultValues: ProductFormValues = {
    title: initial?.title ?? "",
    brand: initial?.brand ?? "",
    price: initial?.price ?? 0,
    description: initial?.description ?? "",
    category: initial?.category?._id ?? initial?.category ?? defaultCategoryId,
  };
  for (const f of fields) {
    defaultValues[f.key] =
      f.kind === "notes"
        ? (Array.isArray(initial?.[f.key]) ? initial[f.key].join("، ") : "")
        : (initial?.[f.key] ?? "");
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(getProductFormSchema(productType)) as Resolver<ProductFormValues>,
    defaultValues,
  });

  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [available, setAvailable] = useState<boolean>(initial?.available ?? true);
  const categoryValue = (watch("category") as string) || defaultCategoryId;

  async function onSubmit(values: ProductFormValues) {
    const payload = formToPayload(productType, values, images, available);
    try {
      if (initial?._id) {
        await apiFetch(`/api/products/${initial._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("محصول به‌روزرسانی شد.");
      } else {
        await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("محصول ایجاد شد.");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره محصول");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="p-title">نام محصول</Label>
        <Input id="p-title" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{String(errors.title.message)}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-brand">برند</Label>
          <Input id="p-brand" {...register("brand")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-price">قیمت (تومان)</Label>
          <Input id="p-price" type="number" inputMode="numeric" dir="ltr" {...register("price")} />
          {errors.price && (
            <p className="text-xs text-destructive">{String(errors.price.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>دسته</Label>
        <Select value={categoryValue} onValueChange={(v) => setValue("category", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          فقط دسته‌های هم‌نوع نمایش داده می‌شوند (نوع محصول قابل تغییر نیست).
        </p>
      </div>

      {/* Type-specific fields, rendered from the central config */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.kind === "number" ? (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={`p-${f.key}`}>
                {f.label}
                {f.unit ? ` (${f.unit})` : ""}
              </Label>
              <Input
                id={`p-${f.key}`}
                type="number"
                inputMode="numeric"
                dir="ltr"
                step="any"
                {...register(f.key)}
              />
            </div>
          ) : (
            <div key={f.key} className="space-y-2 sm:col-span-2">
              <Label htmlFor={`p-${f.key}`}>{f.label} (با ویرگول جدا کنید)</Label>
              <Textarea id={`p-${f.key}`} {...register(f.key)} placeholder="آلبالو، نعناع، یخ" />
            </div>
          ),
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-desc">توضیحات</Label>
        <Textarea id="p-desc" {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label>تصاویر محصول</Label>
        <ImagesField
          value={images}
          initialPreviews={initial?.imageUrls ?? []}
          onChange={setImages}
          folder="products"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label htmlFor="p-available">موجود است</Label>
        <Switch id="p-available" checked={available} onCheckedChange={setAvailable} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          ذخیره
        </Button>
      </DialogFooter>
    </form>
  );
}
