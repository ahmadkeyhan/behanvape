import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";
import { toProductView } from "@/lib/product-view";
import { parseProductPayload, deriveAvailable } from "@/lib/product-schemas";
import type { ProductType } from "@/lib/product-types";

export const runtime = "nodejs";

// GET: list products (admin + cashier). Optional ?category=<id> filter. Used by admin/cashier dashboards.
export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "cashier"]);
    await dbConnect();
    const categoryId = new URL(req.url).searchParams.get("category");
    const query = categoryId ? { category: categoryId } : {};
    const products = await Product.find(query)
      .sort({ category: 1, order: 1, createdAt: 1 })
      .populate("category", "title slug productType")
      .lean();
    return NextResponse.json(serialize(products).map(toProductView));
  } catch (err) {
    return apiError(err);
  }
}

// POST: create a product (admin only). productType is derived from the chosen category.
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const raw = await req.json();

    const category = await Category.findById(raw?.category).lean();
    if (!category) {
      return NextResponse.json({ error: "دستهٔ انتخاب‌شده نامعتبر است." }, { status: 400 });
    }
    const productType = category.productType as ProductType;
    const data = parseProductPayload(productType, raw);
    // For variant types (juice/cartridge) availability is derived from the options.
    data.available = deriveAvailable(productType, data);

    const last = await Product.findOne({ category: category._id })
      .sort({ order: -1 })
      .lean<{ order?: number }>();
    const order = (last?.order ?? -1) + 1;

    const created = await Product.create({ ...data, productType, order });
    return NextResponse.json(serialize(created.toObject()), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
