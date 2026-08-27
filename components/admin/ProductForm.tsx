"use client";

import { useState } from "react";
import Image from "next/image";
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
import { PRODUCT_TYPE_FIELDS, COLOR_PALETTE, type ProductType } from "@/lib/product-types";
import { cn } from "@/lib/utils";
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
  defaultBrand,
  initial,
  onSaved,
}: {
  productType: ProductType;
  categories: { _id: string; title: string }[];
  defaultCategoryId: string;
  /** Prefill brand on create (e.g. admin brand hub). */
  defaultBrand?: string | null;
  initial?: ProductLike | null;
  onSaved: () => void;
}) {
  const fields = PRODUCT_TYPE_FIELDS[productType];
  const variantField = fields.find((f) => f.kind === "variants");
  const variantKey = variantField?.variantKey ?? "value";

  const defaultValues: ProductFormValues = {
    title: initial?.title ?? "",
    brand: initial?.brand ?? defaultBrand ?? "",
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
    } else if (f.kind === "string") {
      defaultValues[f.key] = initial?.[f.key] ?? "";
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
  const [imagePreviews, setImagePreviews] = useState<string[]>(initial?.imageUrls ?? []);
  const [available, setAvailable] = useState<boolean>(initial?.available ?? true);
  const isColor = variantField?.variantType === "color";
  const isNamed = variantField?.variantType === "named";
  const isImageVariant = isColor || isNamed;
  const [variants, setVariants] = useState<
    { value: string; name?: string; available: boolean; image?: string }[]
  >(() =>
    variantField && Array.isArray(initial?.[variantField.key])
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial[variantField.key].map((o: any) =>
          isColor
            ? {
                value: String(o?.color ?? ""),
                name: String(o?.name ?? ""),
                available: o?.available !== false,
                image: typeof o?.image === "string" && o.image ? String(o.image) : undefined,
              }
            : isNamed
              ? {
                  value: String(o?.name ?? ""),
                  name: String(o?.name ?? ""),
                  available: o?.available !== false,
                  image: typeof o?.image === "string" && o.image ? String(o.image) : undefined,
                }
              : { value: String(o?.[variantKey] ?? ""), available: o?.available !== false },
        )
      : [],
  );
  const categoryValue = (watch("category") as string) || defaultCategoryId;

  function handleImagesChange(keys: string[], previews: string[]) {
    setImages(keys);
    setImagePreviews(previews);
    if (isImageVariant) {
      setVariants((prev) =>
        prev.map((v) =>
          v.image && !keys.includes(v.image) ? { ...v, image: undefined } : v,
        ),
      );
    }
  }

  async function onSubmit(values: ProductFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = formToPayload(productType, values, images, available);
    if (variantField) {
      payload[variantField.key] = isColor
        ? variants
            .filter((v) => v.value !== "")
            .map((v) => ({
              color: v.value,
              name: v.name ?? "",
              available: v.available,
              ...(v.image ? { image: v.image } : {}),
            }))
        : isNamed
          ? variants
              .filter((v) => (v.name ?? v.value).trim() !== "")
              .map((v) => ({
                name: (v.name ?? v.value).trim(),
                available: v.available,
                ...(v.image ? { image: v.image } : {}),
              }))
          : variants
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
          if (f.kind === "string") {
            return (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`p-${f.key}`}>{f.label}</Label>
                <Input id={`p-${f.key}`} {...register(f.key)} />
              </div>
            );
          }
          // notes
          return (
            <div key={f.key} className="space-y-2 sm:col-span-2">
              <Label htmlFor={`p-${f.key}`}>{f.label} (با ویرگول جدا کنید)</Label>
              <Textarea id={`p-${f.key}`} {...register(f.key)} placeholder="آلبالو، نعناع، یخ" />
            </div>
          );
        })}
      </div>

      {/* Numeric variants editor (juice nicotine / cartridge resistance): each value + its availability */}
      {variantField && !isColor && !isNamed && (
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
          onChange={handleImagesChange}
          folder="products"
        />
      </div>

      {/* Color variants editor (vape/iqos): palette + optional gallery image per color */}
      {variantField && isColor && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label>{variantField.label}</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => {
              const selected = variants.some((v) => v.value === c.hex);
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={selected}
                  onClick={() =>
                    setVariants((prev) =>
                      prev.some((v) => v.value === c.hex)
                        ? prev.filter((v) => v.value !== c.hex)
                        : [...prev, { value: c.hex, name: c.name, available: true }],
                    )
                  }
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    selected
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border hover:border-primary/50",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground">رنگی انتخاب نشده است.</p>
          ) : (
            <ul className="space-y-3 border-t border-border pt-2">
              {variants.map((v, i) => (
                <li key={v.value} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: v.value }}
                    />
                    <Input
                      value={v.name ?? ""}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="نام نمایشی رنگ"
                      className="h-8 flex-1 text-sm"
                      aria-label="نام نمایشی رنگ"
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
                  </div>
                  <VariantImagePicker
                    images={images}
                    imagePreviews={imagePreviews}
                    selected={v.image}
                    onSelect={(image) =>
                      setVariants((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, image } : x)),
                      )
                    }
                    hint="تصویر این رنگ (اختیاری)"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Named variants editor (cigarette flavors): free-text name + availability + gallery image */}
      {variantField && isNamed && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label>{variantField.label}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants((v) => [...v, { value: "", name: "", available: true }])}
            >
              <Plus className="h-4 w-4" />
              افزودن
            </Button>
          </div>
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground">هنوز طعمی اضافه نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {variants.map((v, i) => (
                <li key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={v.name ?? ""}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, j) =>
                            j === i
                              ? { ...x, name: e.target.value, value: e.target.value }
                              : x,
                          ),
                        )
                      }
                      placeholder="نام طعم"
                      className="h-8 flex-1 text-sm"
                      aria-label="نام طعم"
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
                  </div>
                  <VariantImagePicker
                    images={images}
                    imagePreviews={imagePreviews}
                    selected={v.image}
                    onSelect={(image) =>
                      setVariants((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, image } : x)),
                      )
                    }
                    hint="تصویر این طعم (اختیاری)"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Base availability switch. Hidden when per-variant availability governs (mandatory
          variants, or optional color variants once at least one color is chosen). */}
      {(!variantField || (variantField.optional && variants.length === 0)) && (
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

function VariantImagePicker({
  images,
  imagePreviews,
  selected,
  onSelect,
  hint,
}: {
  images: string[];
  imagePreviews: string[];
  selected?: string;
  onSelect: (image: string | undefined) => void;
  hint: string;
}) {
  return (
    <div className="space-y-1 ps-0 sm:ps-1">
      <p className="text-xs text-muted-foreground">{hint}</p>
      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground">ابتدا تصاویر محصول را بارگذاری کنید.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            title="بدون تصویر"
            aria-label="بدون تصویر"
            aria-pressed={!selected}
            onClick={() => onSelect(undefined)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md border text-[10px] leading-tight",
              !selected
                ? "border-primary ring-2 ring-primary/40"
                : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            هیچ
          </button>
          {images.map((key, imgIdx) => (
            <button
              key={key + imgIdx}
              type="button"
              title={`تصویر ${imgIdx + 1}`}
              aria-label={`تصویر ${imgIdx + 1}`}
              aria-pressed={selected === key}
              onClick={() => onSelect(key)}
              className={cn(
                "relative h-10 w-10 overflow-hidden rounded-md border",
                selected === key
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary/50",
              )}
            >
              {imagePreviews[imgIdx] ? (
                <Image
                  src={imagePreviews[imgIdx]}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  {imgIdx + 1}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
