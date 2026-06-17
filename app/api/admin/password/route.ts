import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { requireRole, apiError } from "@/lib/api-auth";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1, "گذرواژه فعلی را وارد کنید."),
  newPassword: z.string().min(6, "گذرواژهٔ جدید حداقل ۶ نویسه باشد."),
});

// PUT: admin changes ITS OWN password (admin only). A cashier can never reach this route.
export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    await dbConnect();
    const { currentPassword, newPassword } = schema.parse(await req.json());

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "گذرواژهٔ فعلی نادرست است." }, { status: 400 });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
