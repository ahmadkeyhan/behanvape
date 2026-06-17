import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { requireRole, apiError } from "@/lib/api-auth";

export const runtime = "nodejs";

const schema = z.object({
  password: z.string().min(6, "گذرواژه حداقل ۶ نویسه باشد."),
});

type Ctx = { params: Promise<{ id: string }> };

// PUT: admin resets a cashier's password. Admin's own password is changed via /api/admin/password.
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { id } = await params;
    const { password } = schema.parse(await req.json());

    const user = await User.findById(id);
    if (!user || user.role !== "cashier") {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
