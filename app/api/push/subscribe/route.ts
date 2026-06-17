import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { PushSubscription } from "@/models/PushSubscription";

export const runtime = "nodejs";

// Public: store/refresh a browser push subscription (used by notify-me and broadcast alerts).
const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { endpoint, keys } = schema.parse(await req.json());
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "اطلاعات اشتراک نامعتبر است." }, { status: 400 });
    }
    console.error("subscribe error:", err);
    return NextResponse.json({ error: "خطای داخلی." }, { status: 500 });
  }
}
