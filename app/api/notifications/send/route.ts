import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { PushSubscription } from "@/models/PushSubscription";
import { NotificationLog } from "@/models/NotificationLog";
import { requireRole, apiError } from "@/lib/api-auth";
import { sendPush } from "@/lib/push";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است."),
  body: z.string().trim().optional().default(""),
  targetRoute: z.string().trim().default("/"),
});

// POST: broadcast a push to ALL subscriptions (admin). Prunes expired subs, logs the send.
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { title, body, targetRoute } = schema.parse(await req.json());

    const subs = await PushSubscription.find().lean();
    const payload = { title, body, url: targetRoute || "/" };

    let sentCount = 0;
    const expired: unknown[] = [];
    await Promise.all(
      subs.map(async (s) => {
        if (!s.keys?.p256dh || !s.keys?.auth) return;
        const result = await sendPush(
          { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
          payload,
        );
        if (result.ok) sentCount += 1;
        else if (result.expired) expired.push(s._id);
      }),
    );

    if (expired.length) {
      await PushSubscription.deleteMany({ _id: { $in: expired } });
    }

    await NotificationLog.create({ title, body, targetRoute: targetRoute || "/", sentCount });

    return NextResponse.json({ ok: true, sentCount, total: subs.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
