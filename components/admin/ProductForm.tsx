"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
  const variantField = fields.find((f) => f.kind === "variants");
  const variantKey = variantField?.variantKey ?? "value";

  const defaultValues: ProductFormValues = {
    title: initial?.title ?? "",
    brand: initial?.brand ?? "",
    // Empty (not 0) so the field shows a placeholder; zod coerces "" -> 0 on submit.
    price: initial?.price ?? "",
    description: initial?.description ?? "",
    category: initial?.category?._id ?? initial?.category ?? defaultCategoryId,
  };
  for (const f of fields) {
    if (f.kind === "variants") continue; // managed by separate `variants` state below
    if (f.kind === "notes") {
      defaultValues[f.key] = Array.isArray(initial?.[f.key]) ? initial[f.key].join("، ") : "";
    } else if (f.kind === "boolean") {
      defaultValues[f.key] = initial?.[f.key] ?? false;
    } else {
      defaultValues[f.key] = initial?.[f.key] ?? "";
    }
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
  const [variants, setVariants] = useState<{ value: string; available: boolean }[]>(() =>
    variantField && Array.isArray(initial?.[variantField.key])
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial[variantField.key].map((o: any) => ({
          value: String(o?.[variantKey] ?? ""),
          available: o?.available !== false,
        }))
      : [],
  );
  const categoryValue = (watch("category") as string) || defaultCategoryId;

  async function onSubmit(values: ProductFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = formToPayload(productType, values, images, available);
    if (variantField) {
      payload[variantField.key] = variants
        .filter((v) => v.value !== "" && !Number.isNaN(Number(v.value)))
        .map((v) => ({ [variantKey]: Number(v.value), available: v.available }));
    }
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
          <Input
            id="p-price"
            type="number"
            inputMode="numeric"
            dir="ltr"
            placeholder="0"
            {...register("price")}
          />
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
        {fields.map((f) => {
          if (f.kind === "variants") return null; // rendered by the variants editor below
          if (f.kind === "number") {
            return (
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
            );
          }
          if (f.kind === "boolean") {
            return (
              <div
                key={f.key}
                className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2"
              >
                <Label htmlFor={`p-${f.key}`}>{f.label}</Label>
                <Switch
                  id={`p-${f.key}`}
                  checked={!!watch(f.key)}
                  onCheckedChange={(v) => setValue(f.key, v)}
                />
              </div>
            );
          }
          return (
            <div key={f.key} className="space-y-2 sm:col-span-2">
              <Label htmlFor={`p-${f.key}`}>{f.label} (با ویرگول جدا کنید)</Label>
              <Textarea id={`p-${f.key}`} {...register(f.key)} placeholder="آلبالو، نعناع، یخ" />
            </div>
          );
        })}
      </div>

      {/* Variants editor (juice nicotine / cartridge resistance): each value + its availability */}
      {variantField && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label>
              {variantField.label}
              {variantField.unit ? ` (${variantField.unit})` : ""}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants((v) => [...v, { value: "", available: true }])}
            >
              <Plus className="h-4 w-4" />
              افزودن
            </Button>
          </div>
          {variants.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">هنوز گزینه‌ای اضافه نشده است.</p>
          ) : (
            <ul className="space-y-2">
              {variants.map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    step="any"
                    placeholder={variantField.unit ?? "مقدار"}
                    value={v.value}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                      )
                    }
                    className="flex-1"
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    موجود
                    <Switch
                      checked={v.available}
                      onCheckedChange={(c) =>
                        setVariants((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, available: c } : x)),
                        )
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

      {/* For variant types availability is per-variant (above); the base switch is hidden. */}
      {!variantField && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="p-available">موجود است</Label>
          <Switch id="p-available" checked={available} onCheckedChange={setAvailable} />
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          ذخیره
        </Button>
      </DialogFooter>
    </form>
  );
}
