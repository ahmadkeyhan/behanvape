import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@/models/User";

/** Thrown by requireRole; converted to a JSON response by apiError(). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Server-side role gate for API routes. Every admin route calls this — never
 * trust client-side hiding. Throws ApiError(401/403) the caller converts via apiError().
 */
export async function requireRole(roles: UserRole[]): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError(401, "برای انجام این عملیات باید وارد شوید.");
  }
  const role = session.user.role;
  if (!role || !roles.includes(role)) {
    throw new ApiError(403, "شما اجازهٔ دسترسی به این بخش را ندارید.");
  }
  return session;
}

/** Converts any caught error into a JSON NextResponse. */
export function apiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("API error:", err);
  const message = err instanceof Error ? err.message : "خطای داخلی سرور.";
  return NextResponse.json({ error: message }, { status: 500 });
}
