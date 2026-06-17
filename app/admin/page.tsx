import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { CashierBoard } from "@/components/admin/CashierBoard";

// ASSUMPTION: middleware already blocks unauthenticated access; this is a defense-in-depth check.
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");

  const role = session.user.role;
  return (
    <div className="min-h-dvh">
      <AdminHeader username={session.user.username} role={role} />
      <main className="container py-6">
        {role === "admin" ? <AdminTabs /> : <CashierBoard />}
      </main>
    </div>
  );
}
