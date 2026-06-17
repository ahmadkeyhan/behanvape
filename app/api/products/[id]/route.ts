import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { NotifyRequest } from "@/models/NotifyRequest";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";
import { toProductView } from "@/lib/product-view";
import { parseProductPayload } from "@/lib/product-schemas";
import type { ProductType } from "@/lib/product-types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// GET: public single product (used to open a deep-linked product modal from a restock notification).
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }
    return NextResponse.json(toProductView(serialize(product)));
  } catch (err) {
    return apiError(err);
  }
}

// PATCH: full edit of an existing product (admin only). productType never changes here.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const raw = await req.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }
    const productType = product.productType as ProductType;

    // Category may change only among categories of the SAME productType (can't switch discriminator).
    if (raw?.category && String(raw.category) !== String(product.category)) {
      const newCat = await Category.findById(raw.category).lean();
      if (!newCat) {
        return NextResponse.json({ error: "دستهٔ انتخاب‌شده نامعتبر است." }, { status: 400 });
      }
      if (newCat.productType !== productType) {
        return NextResponse.json(
          { error: "نوع دستهٔ جدید با نوع این محصول هم‌خوان نیست. محصول جدیدی بسازید." },
          { status: 400 },
        );
      }
    }

    const data = parseProductPayload(productType, {
      ...raw,
      category: raw?.category ?? String(product.category),
    });

    Object.assign(product, data);
    await product.save();
    return NextResponse.json(serialize(product.toObject()));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}

// DELETE: remove product and any pending restock requests for it (admin only).
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }
    await NotifyRequest.deleteMany({ product: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
