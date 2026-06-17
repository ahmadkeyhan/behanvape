import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { PushSubscription } from "@/models/PushSubscription";
import { NotifyRequest } from "@/models/NotifyRequest";

export const runtime = "nodejs";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { endpoint } = schema.parse(await req.json());
    const sub = await PushSubscription.findOneAndDelete({ endpoint });
    if (sub) await NotifyRequest.deleteMany({ subscription: sub._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });
    }
    console.error("unsubscribe error:", err);
    return NextResponse.json({ error: "خطای داخلی." }, { status: 500 });
  }
}
