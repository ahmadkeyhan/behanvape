import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { requireRole, apiError } from "@/lib/api-auth";

export const runtime = "nodejs";

const schema = z.object({
  categoryId: z.string().min(1),
  brand: z.string().trim().min(1, "برند الزامی است."),
  price: z.coerce.number().int().min(0),
});

/** Set absolute price for every product in a category with the given brand. */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { categoryId, brand, price } = schema.parse(await req.json());

    const result = await Product.updateMany(
      { category: categoryId, brand },
      { $set: { price } },
    );

    return NextResponse.json({ ok: true, updated: result.matchedCount });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "ورودی نامعتبر." },
        { status: 400 },
      );
    }
    return apiError(err);
  }
}
