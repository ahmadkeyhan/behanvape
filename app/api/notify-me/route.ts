import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { PushSubscription } from "@/models/PushSubscription";
import { NotifyRequest } from "@/models/NotifyRequest";

export const runtime = "nodejs";

// Public: register a restock alert for one product, tied to a push subscription.
const schema = z.object({
  productId: z.string().min(1),
  subscriptionEndpoint: z.string().url(),
  // specific variant value (juice strength / cartridge resistance), if this is a variant product
  variant: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { productId, subscriptionEndpoint, variant } = schema.parse(await req.json());

    const product = await Product.findById(productId).select("_id available").lean();
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }

    const subscription = await PushSubscription.findOne({ endpoint: subscriptionEndpoint });
    if (!subscription) {
      return NextResponse.json(
        { error: "ابتدا اعلان‌ها را فعال کنید." },
        { status: 400 },
      );
    }

    // Compound unique index makes this idempotent; ignore duplicate-key errors.
    try {
      await NotifyRequest.create({
        product: productId,
        subscription: subscription._id,
        variant: variant ?? null,
      });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e as any)?.code !== 11000) throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });
    }
    console.error("notify-me error:", err);
    return NextResponse.json({ error: "خطای داخلی." }, { status: 500 });
  }
}
