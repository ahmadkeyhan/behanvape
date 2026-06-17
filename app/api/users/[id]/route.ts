import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";

export const runtime = "nodejs";

const updateSchema = z.object({
  username: z.string().trim().min(3, "نام کاربری حداقل ۳ نویسه باشد."),
});

type Ctx = { params: Promise<{ id: string }> };

// PATCH: rename a cashier (admin). Admin accounts cannot be edited here.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const { username } = updateSchema.parse(await req.json());

    const user = await User.findById(id);
    if (!user || user.role !== "cashier") {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }
    if (await User.exists({ username, _id: { $ne: id } })) {
      return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده است." }, { status: 409 });
    }
    user.username = username;
    await user.save();
    return NextResponse.json(serialize({ _id: user._id, username: user.username, role: user.role }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}

// DELETE: remove a cashier (admin). Admin accounts are protected.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user || user.role !== "cashier") {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }
    await user.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
