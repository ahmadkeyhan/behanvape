import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";
import { slugify } from "@/lib/format";
import { PRODUCT_TYPES, type ProductType } from "@/lib/product-types";

export const runtime = "nodejs";

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  productType: z.enum(PRODUCT_TYPES as unknown as [ProductType, ...ProductType[]]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });
    }

    // productType is locked once the category has products (would orphan attribute data).
    if (data.productType && data.productType !== category.productType) {
      const hasProducts = await Product.exists({ category: id });
      if (hasProducts) {
        return NextResponse.json(
          { error: "تا زمانی که محصولی در این دسته وجود دارد، نوع محصول قابل تغییر نیست." },
          { status: 400 },
        );
      }
      category.productType = data.productType;
    }

    if (typeof data.title === "string") category.title = data.title;
    if (typeof data.description === "string") category.description = data.description;
    if (typeof data.image === "string") category.image = data.image;

    if (typeof data.slug === "string" && data.slug.trim()) {
      let nextSlug = slugify(data.slug);
      const clash = await Category.exists({ slug: nextSlug, _id: { $ne: id } });
      if (clash) nextSlug = `${nextSlug}-${Math.random().toString(36).slice(2, 6)}`;
      category.slug = nextSlug;
    }

    await category.save();
    return NextResponse.json(serialize(category.toObject()));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;

    // Non-destructive: block deletion while products still reference this category.
    const hasProducts = await Product.exists({ category: id });
    if (hasProducts) {
      return NextResponse.json(
        { error: "ابتدا محصولات این دسته را حذف کنید، سپس دسته را پاک کنید." },
        { status: 400 },
      );
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
