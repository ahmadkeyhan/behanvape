import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { NotifyRequest } from "@/models/NotifyRequest";
import { PushSubscription } from "@/models/PushSubscription";
import { requireRole, apiError } from "@/lib/api-auth";
import { sendPush } from "@/lib/push";
import { serialize } from "@/lib/serialize";
import { getVariantField, type ProductType } from "@/lib/product-types";
import { deriveAvailable } from "@/lib/product-schemas";

export const runtime = "nodejs";

// `variant` present -> toggle one variant (juice strength / cartridge resistance). Else whole product.
const schema = z.object({ available: z.boolean().optional(), variant: z.number().optional() });

type Ctx = { params: Promise<{ id: string }> };

// PATCH availability — allowed for admin AND cashier.
// On unavailable -> available (per variant or whole product), fire one-time restock pushes.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin", "cashier"]);
    await dbConnect();
    const { id } = await params;
    const { available, variant } = schema.parse(await req.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (await Product.findById(id)) as any;
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }
    const productType = product.productType as ProductType;
    const vf = getVariantField(productType);

    // ---- Per-variant toggle (juice/cartridge) ----
    if (variant != null && vf) {
      const vk = vf.variantKey as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opt = (product[vf.key] as any[])?.find((o) => o?.[vk] === variant);
      if (!opt) {
        return NextResponse.json({ error: "گزینه یافت نشد." }, { status: 404 });
      }
      const was = opt.available;
      opt.available = available ?? !was;
      product.available = deriveAvailable(productType, product);
      product.markModified(vf.key);
      await product.save();

      if (!was && opt.available) {
        const label = `${variant}${vf.unit ? " " + vf.unit : ""}`;
        await sendRestockNotifications(id, product.title, product.category, variant, label);
      }
      return NextResponse.json(serialize(product.toObject()));
    }

    // ---- Whole-product toggle ----
    if (typeof available !== "boolean") {
      return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });
    }
    const wasAvailable = product.available;
    product.available = available;
    await product.save();
    if (!wasAvailable && available) {
      await sendRestockNotifications(id, product.title, product.category, null);
    }
    return NextResponse.json(serialize(product.toObject()));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}

async function sendRestockNotifications(
  productId: string,
  productTitle: string,
  categoryId: unknown,
  variant: number | null,
  variantLabel?: string,
) {
  const requests = await NotifyRequest.find({ product: productId, variant: variant ?? null })
    .populate("subscription")
    .lean();
  if (requests.length === 0) return;

  const category = await Category.findById(categoryId).lean();
  const url = `/products/${category?.slug ?? ""}?product=${productId}`;
  const body =
    variant != null
      ? `${productTitle} (${variantLabel}) اکنون موجود است.`
      : `${productTitle} اکنون موجود است.`;
  const payload = { title: "دوباره موجود شد! 🎉", body, url };

  const expiredSubIds: unknown[] = [];
  for (const r of requests) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = r.subscription as any;
    if (!sub?.endpoint || !sub?.keys) continue;
    const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    if (result.expired) expiredSubIds.push(sub._id);
  }

  // One-time alert per restock: clear just this (product, variant) set.
  await NotifyRequest.deleteMany({ product: productId, variant: variant ?? null });
  if (expiredSubIds.length) {
    await PushSubscription.deleteMany({ _id: { $in: expiredSubIds } });
  }
}
