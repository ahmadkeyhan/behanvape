"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { formatPrice, toFaDigits } from "@/lib/format";
import { type ProductType } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ProductForm } from "@/components/admin/ProductForm";
import { AvailabilityToggles } from "@/components/admin/AvailabilityToggles";
import { Pagination } from "@/components/catalog/Pagination";
import { SearchControl } from "@/components/catalog/SearchControl";
import { matchesProductSearch } from "@/lib/product-search";

/** Match public catalog `PER_PAGE` in lib/public-data.ts */
const PER_PAGE = 12;

export interface AdminProductCategory {
  _id: string;
  title: string;
  productType: ProductType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductItem = Record<string, any> & {
  _id: string;
  title: string;
  brand?: string;
  price: number;
  available: boolean;
  imageUrls: string[];
  productType: ProductType;
};

export function AdminProductList({
  categoryId,
  productType,
  brandName,
  categories,
}: {
  categoryId: string;
  productType: ProductType;
  /** Locked brand display name, or null for «همه». */
  brandName: string | null;
  categories: AdminProductCategory[];
}) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkPriceSaving, setBulkPriceSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sameTypeCategories = useMemo(
    () => categories.filter((c) => c.productType === productType),
    [categories, productType],
  );

  const filtered = useMemo(() => {
    const byBrand = !brandName
      ? products
      : products.filter(
          (p) => (typeof p.brand === "string" ? p.brand.trim() : "") === brandName,
        );
    const q = searchParams.get("q") ?? "";
    if (!q.trim()) return byBrand;
    return byBrand.filter((p) => matchesProductSearch(p, q));
  }, [products, brandName, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRaw = Number(searchParams.get("page")) || 1;
  const page = Math.min(Math.max(1, pageRaw), totalPages);
  const pageStart = (page - 1) * PER_PAGE;
  const displayed = filtered.slice(pageStart, pageStart + PER_PAGE);
  const q = searchParams.get("q") ?? "";

  // DnD only on full category list (no brand lock, no search) — page slice maps to products order.
  const canReorder = !brandName && !q.trim();

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await apiFetch<ProductItem[]>(`/api/products?category=${categoryId}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری محصولات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function onDragEnd(event: DragEndEvent) {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldInPage = displayed.findIndex((i) => i._id === active.id);
    const newInPage = displayed.findIndex((i) => i._id === over.id);
    if (oldInPage < 0 || newInPage < 0) return;

    const reorderedPage = arrayMove(displayed, oldInPage, newInPage);
    const next = [
      ...products.slice(0, pageStart),
      ...reorderedPage,
      ...products.slice(pageStart + displayed.length),
    ];
    setProducts(next);
    try {
      await apiFetch("/api/products/reorder", {
        method: "PATCH",
        body: JSON.stringify({ ids: next.map((i) => i._id) }),
      });
    } catch {
      toast.error("ذخیره ترتیب ناموفق بود.");
      loadProducts();
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/products/${deleteId}`, { method: "DELETE" });
      toast.success("محصول حذف شد.");
      setDeleteId(null);
      await loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف محصول");
    } finally {
      setDeleting(false);
    }
  }

  async function onBulkPrice() {
    if (!brandName) return;
    const price = Number(bulkPrice);
    if (bulkPrice.trim() === "" || !Number.isInteger(price) || price < 0) {
      toast.error("قیمت باید عدد صحیح صفر یا بیشتر باشد.");
      return;
    }
    setBulkPriceSaving(true);
    try {
      const res = await apiFetch<{ ok: boolean; updated: number }>("/api/products/bulk-price", {
        method: "PATCH",
        body: JSON.stringify({ categoryId, brand: brandName, price }),
      });
      toast.success(`قیمت ${toFaDigits(res.updated)} محصول به‌روز شد.`);
      setPriceDialogOpen(false);
      setBulkPrice("");
      await loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر قیمت");
    } finally {
      setBulkPriceSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchControl className="sm:max-w-sm" placeholder="جستجوی محصول…" />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
          {brandName && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBulkPrice("");
                setPriceDialogOpen(true);
              }}
            >
              تغییر قیمت
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {q.trim()
            ? "نتیجه‌ای برای جستجو یافت نشد."
            : brandName
              ? "محصولی برای این برند نیست."
              : "محصولی در این دسته نیست."}
        </p>
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={displayed.map((i) => i._id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {displayed.map((p) => (
                <SortableProductRow
                  key={p._id}
                  product={p}
                  onEdit={() => {
                    setEditing(p);
                    setDialogOpen(true);
                  }}
                  onDelete={() => setDeleteId(p._id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {displayed.map((p) => (
            <ProductRow
              key={p._id}
              product={p}
              onEdit={() => {
                setEditing(p);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteId(p._id)}
            />
          ))}
        </ul>
      )}

      {!loading && filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش محصول" : "افزودن محصول"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editing?._id ?? `new-${brandName ?? "all"}`}
            productType={productType}
            categories={sameTypeCategories}
            defaultCategoryId={categoryId}
            defaultBrand={editing ? undefined : brandName}
            initial={editing}
            onSaved={() => {
              setDialogOpen(false);
              loadProducts();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={priceDialogOpen}
        onOpenChange={(o) => {
          setPriceDialogOpen(o);
          if (!o) setBulkPrice("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تغییر قیمت — {brandName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-price">قیمت جدید (تومان)</Label>
            <Input
              id="bulk-price"
              type="number"
              inputMode="numeric"
              dir="ltr"
              min={0}
              step={1}
              placeholder="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              disabled={bulkPriceSaving}
            />
            <p className="text-xs text-muted-foreground">
              قیمت همهٔ محصولات این برند در این دسته به این مقدار تغییر می‌کند.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={onBulkPrice}
              disabled={bulkPriceSaving || bulkPrice.trim() === ""}
            >
              {bulkPriceSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              اعمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف محصول"
        description="آیا از حذف این محصول مطمئن هستید؟"
        onConfirm={onDelete}
        loading={deleting}
      />
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  dragHandle,
  rowRef,
  style,
}: {
  product: ProductItem;
  onEdit: () => void;
  onDelete: () => void;
  dragHandle?: ReactNode;
  rowRef?: (node: HTMLLIElement | null) => void;
  style?: CSSProperties;
}) {
  return (
    <li
      ref={rowRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
    >
      {dragHandle}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrls?.[0] && (
          <Image
            src={product.imageUrls[0]}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          <p className="font-medium leading-6 break-words">{product.title}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
          {((product.productType === "juice" &&
            Array.isArray(product.notes) &&
            product.notes.length > 0) ||
            (product.productType === "cigarette" &&
              Array.isArray(product.flavorOptions) &&
              product.flavorOptions.length > 0)) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {(product.productType === "cigarette"
                  ? product.flavorOptions.map((o: { name?: string }) => o.name).filter(Boolean)
                  : product.notes
                ).map((n: string) => (
                  <Badge key={n} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                    {n}
                  </Badge>
                ))}
              </div>
            )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <AvailabilityToggles product={product} />
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="ویرایش">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="حذف"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function SortableProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <ProductRow
      product={product}
      onEdit={onEdit}
      onDelete={onDelete}
      rowRef={setNodeRef}
      style={style}
      dragHandle={
        <button
          type="button"
          className="mt-1 shrink-0 touch-none cursor-grab p-1 text-muted-foreground hover:text-foreground"
          aria-label="جابه‌جایی"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      }
    />
  );
}
