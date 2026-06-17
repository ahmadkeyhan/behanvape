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

export const runtime = "nodejs";

const schema = z.object({ available: z.boolean() });

type Ctx = { params: Promise<{ id: string }> };

// PATCH availability — allowed for admin AND cashier.
// On unavailable -> available, fire one-time restock pushes to everyone who signed up.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin", "cashier"]);
    await dbConnect();
    const { id } = await params;
    const { available } = schema.parse(await req.json());

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }

    const wasAvailable = product.available;
    product.available = available;
    await product.save();

    // Restock trigger: only on the false -> true transition.
    if (!wasAvailable && available) {
      await sendRestockNotifications(id, product.title, product.category);
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
) {
  const requests = await NotifyRequest.find({ product: productId })
    .populate("subscription")
    .lean();
  if (requests.length === 0) return;

  const category = await Category.findById(categoryId).lean();
  const url = `/products/${category?.slug ?? ""}?product=${productId}`;
  const payload = {
    title: "دوباره موجود شد! 🎉",
    body: `${productTitle} اکنون موجود است.`,
    url,
  };

  const expiredSubIds: unknown[] = [];
  for (const r of requests) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = r.subscription as any;
    if (!sub?.endpoint || !sub?.keys) continue;
    const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    if (result.expired) expiredSubIds.push(sub._id);
  }

  // One-time alert per restock: clear the requests regardless of individual send outcome.
  await NotifyRequest.deleteMany({ product: productId });
  if (expiredSubIds.length) {
    await PushSubscription.deleteMany({ _id: { $in: expiredSubIds } });
  }
}
