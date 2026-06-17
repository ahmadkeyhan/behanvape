"use client";

import { useEffect, useState } from "react";
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
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES, type ProductType } from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageField } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface CategoryItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  imageUrl: string;
  productType: ProductType;
  order: number;
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  productType: ProductType;
  image: string;
  imageUrl: string;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  productType: "juice",
  image: "",
  imageUrl: "",
};

export function CategoriesTab() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function load() {
    setLoading(true);
    try {
      setItems(await apiFetch<CategoryItem[]>("/api/categories"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری دسته‌ها");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(c: CategoryItem) {
    setEditingId(c._id);
    setForm({
      title: c.title,
      slug: c.slug,
      description: c.description,
      productType: c.productType,
      image: c.image,
      imageUrl: c.imageUrl,
    });
    setDialogOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("عنوان دسته را وارد کنید.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        image: form.image,
        productType: form.productType,
      };
      if (editingId) {
        await apiFetch(`/api/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("دسته به‌روزرسانی شد.");
      } else {
        await apiFetch("/api/categories", { method: "POST", body: JSON.stringify(payload) });
        toast.success("دسته ایجاد شد.");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره دسته");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/categories/${deleteId}`, { method: "DELETE" });
      toast.success("دسته حذف شد.");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف دسته");
    } finally {
      setDeleting(false);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      await apiFetch("/api/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ ids: next.map((i) => i._id) }),
      });
    } catch {
      toast.error("ذخیره ترتیب ناموفق بود.");
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">دسته‌بندی‌ها</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          افزودن دسته
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">هنوز دسته‌ای ثبت نشده است.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((c) => (
                <SortableCategoryRow
                  key={c._id}
                  category={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => setDeleteId(c._id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش دسته" : "افزودن دسته"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-title">عنوان</Label>
              <Input
                id="cat-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">اسلاگ (اختیاری)</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                dir="ltr"
                placeholder="در صورت خالی بودن از عنوان ساخته می‌شود"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">توضیحات</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>نوع محصول</Label>
              <Select
                value={form.productType}
                onValueChange={(v) => setForm({ ...form, productType: v as ProductType })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PRODUCT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  نوع محصول پس از ایجاد دسته قابل تغییر نیست (برای جلوگیری از ناسازگاری ویژگی‌ها).
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>تصویر دسته</Label>
              <ImageField
                value={form.image}
                initialPreview={form.imageUrl}
                folder="categories"
                onChange={(key) => setForm({ ...form, image: key })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف دسته"
        description="آیا از حذف این دسته مطمئن هستید؟"
        onConfirm={onDelete}
        loading={deleting}
      />
    </div>
  );
}

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
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
        {category.imageUrl && (
          <Image src={category.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{category.title}</span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {PRODUCT_TYPE_LABELS[category.productType]}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          /{category.slug}
        </p>
      </div>
      <div className="flex items-center gap-1">
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
