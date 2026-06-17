import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";

export const runtime = "nodejs";

const createSchema = z.object({
  username: z.string().trim().min(3, "نام کاربری حداقل ۳ نویسه باشد."),
  password: z.string().min(6, "گذرواژه حداقل ۶ نویسه باشد."),
});

// GET: list cashier users only (admin). The single admin account is never listed/editable here.
export async function GET() {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const users = await User.find({ role: "cashier" })
      .select("username role createdAt")
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(serialize(users));
  } catch (err) {
    return apiError(err);
  }
}

// POST: create a cashier (admin). Role is forced to "cashier" — no UI to create another admin.
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const { username, password } = createSchema.parse(await req.json());

    if (await User.exists({ username })) {
      return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده است." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({ username, passwordHash, role: "cashier" });
    return NextResponse.json(
      serialize({ _id: created._id, username: created.username, role: created.role }),
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "ورودی نامعتبر." }, { status: 400 });
    }
    return apiError(err);
  }
}
