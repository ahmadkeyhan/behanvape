import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Session gate for admin-only product manage pages. Cashiers → `/admin`. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "admin") redirect("/admin");
  return session;
}
