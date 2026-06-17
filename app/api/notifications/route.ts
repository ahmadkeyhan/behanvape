import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { NotificationLog } from "@/models/NotificationLog";
import { requireRole, apiError } from "@/lib/api-auth";
import { serialize } from "@/lib/serialize";

export const runtime = "nodejs";

// GET: recent broadcast log (admin).
export async function GET() {
  try {
    await requireRole(["admin"]);
    await dbConnect();
    const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(30).lean();
    return NextResponse.json(serialize(logs));
  } catch (err) {
    return apiError(err);
  }
}
