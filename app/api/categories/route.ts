import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Category } from "@/models/Category";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";
import { getPublicUrl } from "@/lib/s3";
import { slugify } from "@/lib/format";
import { PRODUCT_TYPES, type ProductType } from "@/lib/product-types";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است."),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  productType: z.enum(PRODUCT_TYPES as unknown as [ProductType, ...ProductType[]]),
});

// GET: list categories in display order. Read allowed for admin + cashier (cashier filters by category).
export async function GET() {
  try {
    await requireRole(["admin", "cashier"]);
    await dbConnect();
    const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
    const withUrls = serialize(categories).map((c) => ({ ...c, imageUrl: getPublicUrl(c.image) }));
    return NextResponse.json(withUrls);
  } catch (err) {
    return apiError(err);
  }
}

// POST: create a category (admin only).
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const body = await req.json();
    const data = createSchema.parse(body);

    const baseSlug = slugify(data.slug || data.title);
    const last = await Category.findOne().sort({ order: -1 }).lean();
    const order = (last?.order ?? -1) + 1;

    // Ensure unique slug (append a short suffix on collision).
    let slug = baseSlug;
    if (await Category.exists({ slug })) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const created = await Category.create({
      title: data.title,
      slug,
      description: data.description || "",
      image: data.image || "",
      productType: data.productType,
      order,
    });

    return NextResponse.json(serialize(created.toObject()), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
