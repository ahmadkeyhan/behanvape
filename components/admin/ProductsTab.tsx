"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatPrice } from "@/lib/format";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ProductForm } from "@/components/admin/ProductForm";

interface CategoryItem {
  _id: string;
  title: string;
  productType: ProductType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductItem = Record<string, any> & {
  _id: string;
  title: string;
  price: number;
  available: boolean;
  imageUrls: string[];
  productType: ProductType;
};

export function ProductsTab() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const currentCategory = categories.find((c) => c._id === selectedCat);
  const sameTypeCategories = useMemo(
    () =>
      currentCategory
        ? categories.filter((c) => c.productType === currentCategory.productType)
        : categories,
    [categories, currentCategory],
  );

  useEffect(() => {
    apiFetch<CategoryItem[]>("/api/categories")
      .then((cats) => {
        setCategories(cats);
        if (cats.length) setSelectedCat((prev) => prev || cats[0]._id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "خطا در بارگذاری دسته‌ها"));
  }, []);

  async function loadProducts(catId: string) {
    if (!catId) return;
    setLoading(true);
    try {
      setProducts(await apiFetch<ProductItem[]>(`/api/products?category=${catId}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری محصولات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCat) loadProducts(selectedCat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCat]);

  async function toggleAvailability(p: ProductItem, value: boolean) {
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: value } : x)));
    try {
      await apiFetch(`/api/products/${p._id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ available: value }),
      });
    } catch (err) {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: !value } : x)));
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex((i) => i._id === active.id);
    const newIndex = products.findIndex((i) => i._id === over.id);
    const next = arrayMove(products, oldIndex, newIndex);
    setProducts(next);
    try {
      await apiFetch("/api/products/reorder", {
        method: "PATCH",
        body: JSON.stringify({ ids: next.map((i) => i._id) }),
      });
    } catch {
      toast.error("ذخیره ترتیب ناموفق بود.");
      loadProducts(selectedCat);
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/products/${deleteId}`, { method: "DELETE" });
      toast.success("محصول حذف شد.");
      setDeleteId(null);
      await loadProducts(selectedCat);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف محصول");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">دسته</span>
          <Select value={selectedCat} onValueChange={setSelectedCat}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="انتخاب دسته" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.title} — {PRODUCT_TYPE_LABELS[c.productType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          disabled={!selectedCat}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          افزودن محصول
        </Button>
      </div>

      {!selectedCat ? (
        <p className="py-12 text-center text-muted-foreground">ابتدا یک دسته بسازید.</p>
      ) : loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">محصولی در این دسته نیست.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={products.map((i) => i._id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {products.map((p) => (
                <SortableProductRow
                  key={p._id}
                  product={p}
                  onToggle={(v) => toggleAvailability(p, v)}
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
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش محصول" : "افزودن محصول"}</DialogTitle>
          </DialogHeader>
          {currentCategory && (
            <ProductForm
              productType={currentCategory.productType}
              categories={sameTypeCategories}
              defaultCategoryId={selectedCat}
              initial={editing}
              onSaved={() => {
                setDialogOpen(false);
                loadProducts(selectedCat);
              }}
            />
          )}
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

function SortableProductRow({
  product,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: ProductItem;
  onToggle: (v: boolean) => void;
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
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <button
        type="button"
        className="touch-none cursor-grab p-1 text-muted-foreground hover:text-foreground"
        aria-label="جابه‌جایی"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
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
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.title}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={product.available ? "success" : "secondary"} className="hidden sm:inline-flex">
          {product.available ? "موجود" : "ناموجود"}
        </Badge>
        <Switch checked={product.available} onCheckedChange={onToggle} aria-label="وضعیت موجودی" />
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
    </li>
  );
}
