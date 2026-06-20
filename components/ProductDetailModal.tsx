"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatNumber } from "@/lib/format";
import { PRODUCT_TYPE_FIELDS, getVariantField } from "@/lib/product-types";
import { subscribeToPush } from "@/lib/push-client";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { PublicProduct } from "@/lib/public-data";

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
}: {
  product: PublicProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [notifyState, setNotifyState] = useState<"idle" | "loading" | "done">("idle");
  const [notifyingVariant, setNotifyingVariant] = useState<number | null>(null);
  const [notifiedVariants, setNotifiedVariants] = useState<Set<number>>(new Set());

  useEffect(() => {
    setActiveImg(0);
    setNotifyState("idle");
    setNotifyingVariant(null);
    setNotifiedVariants(new Set());
  }, [product?._id]);

  if (!product) return null;

  const fields = PRODUCT_TYPE_FIELDS[product.productType] ?? [];
  const images = product.imageUrls?.length ? product.imageUrls : [];
  const variantField = getVariantField(product.productType);

  async function handleNotify() {
    if (!product) return;
    setNotifyState("loading");
    try {
      const endpoint = await subscribeToPush();
      await apiFetch("/api/notify-me", {
        method: "POST",
        body: JSON.stringify({ productId: product._id, subscriptionEndpoint: endpoint }),
      });
      setNotifyState("done");
      toast.success("ثبت شد!");
    } catch (err) {
      setNotifyState("idle");
      toast.error(err instanceof Error ? err.message : "خطا در ثبت اعلان");
    }
  }

  async function handleNotifyVariant(value: number) {
    if (!product) return;
    setNotifyingVariant(value);
    try {
      const endpoint = await subscribeToPush();
      await apiFetch("/api/notify-me", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          subscriptionEndpoint: endpoint,
          variant: value,
        }),
      });
      setNotifiedVariants((prev) => new Set(prev).add(value));
      toast.success("ثبت شد!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت اعلان");
    } finally {
      setNotifyingVariant(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto p-0">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {images[activeImg] ? (
              <Image
                src={images[activeImg]}
                alt={product.title}
                fill
                sizes="512px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                بدون تصویر
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border",
                    i === activeImg ? "border-primary" : "border-border",
                  )}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4 p-5">
            <DialogHeader>
              {product.brand && (
                <span className="text-sm text-muted-foreground">{product.brand}</span>
              )}
              <DialogTitle className="text-xl">{product.title}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between">
              {product.available ? (
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              ) : (
                <Badge variant="secondary">ناموجود</Badge>
              )}
              {product.available && <Badge variant="success">موجود</Badge>}
            </div>

            {product.description && (
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {product.description}
              </p>
            )}

            {/* Type-specific attributes */}
            <dl className="grid grid-cols-2 gap-3">
              {fields.map((f) => {
                const value = product[f.key];
                if (f.kind === "variants") {
                  const vk = f.variantKey as string;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const opts = value as { available: boolean; [k: string]: any }[] | undefined;
                  if (!Array.isArray(opts) || opts.length === 0) return null;
                  return (
                    <div key={f.key} className="col-span-2 space-y-1.5">
                      <dt className="text-xs text-muted-foreground">
                        {f.label}
                        {f.unit ? ` (${f.unit})` : ""}
                      </dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {opts.map((o, i) => {
                          const val = Number(o[vk]);
                          if (o.available) {
                            return (
                              <Badge key={i} variant="outline">
                                {String(o[vk])}
                              </Badge>
                            );
                          }
                          const done = notifiedVariants.has(val);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={done || notifyingVariant === val}
                              onClick={() => handleNotifyVariant(val)}
                              title="موجود شد خبرم کن"
                              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-opacity hover:opacity-100"
                            >
                              <span className={cn(!done && "line-through opacity-70")}>
                                {String(o[vk])}
                              </span>
                              {notifyingVariant === val ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : done ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <BellRing className="h-3 w-3" />
                              )}
                            </button>
                          );
                        })}
                      </dd>
                    </div>
                  );
                }
                if (f.kind === "notes") {
                  if (!Array.isArray(value) || value.length === 0) return null;
                  return (
                    <div key={f.key} className="col-span-2 space-y-1.5">
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {value.map((n: string) => (
                          <Badge key={n} variant="outline">
                            {n}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  );
                }
                if (f.kind === "boolean") {
                  return (
                    <div key={f.key} className="rounded-lg bg-muted/50 p-3">
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="mt-0.5 font-medium">{value ? "دارد" : "ندارد"}</dd>
                    </div>
                  );
                }
                if (value == null || value === "") return null;
                return (
                  <div key={f.key} className="rounded-lg bg-muted/50 p-3">
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="mt-0.5 font-medium">
                      {formatNumber(value)}
                      {f.unit ? ` ${f.unit}` : ""}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {!variantField && !product.available && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleNotify}
                disabled={notifyState !== "idle"}
                variant={notifyState === "done" ? "secondary" : "default"}
              >
                {notifyState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {notifyState === "done" ? (
                  <>
                    <Check className="h-4 w-4" />
                    به محض موجود شدن اطلاع می‌دهیم
                  </>
                ) : (
                  <>
                    <BellRing className="h-4 w-4" />
                    موجود شد خبرم کن!
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
