import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
import { requireRole, apiError } from "@/lib/api-auth";

export const runtime = "nodejs";

const schema = z.object({
  // Ordered list of product ids (within a single category); index becomes the new `order`.
  ids: z.array(z.string()).min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { ids } = schema.parse(await req.json());

    await Product.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      })),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
