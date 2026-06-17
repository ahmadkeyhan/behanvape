"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AccountControls({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;

  // Logged out -> link to the admin login.
  if (status !== "loading" && !user) {
    if (compact) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/login">
            <LogIn className="h-4 w-4" />
            ورود
          </Link>
        </Button>
      );
    }
    return (
      <Link
        href="/admin/login"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-base font-medium"
      >
        <LogIn className="h-5 w-5 text-primary" />
        ورود به پنل
      </Link>
    );
  }

  if (!user) return null; // still loading

  // Logged in.
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden lg:inline">پنل مدیریت</span>
          </Link>
        </Button>
        <span className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
          <User className="h-4 w-4" />
          {user.username}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="خروج"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:inline">خروج</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-2">
        <span className="flex items-center gap-2 text-base font-medium">
          <User className="h-5 w-5 text-primary" />
          {user.username}
        </span>
        <Badge variant="secondary">{role === "admin" ? "مدیر" : "صندوق‌دار"}</Badge>
      </div>
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LayoutDashboard className="h-4 w-4" />
        پنل مدیریت
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: "/" });
        }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-accent"
      >
        <LogOut className="h-4 w-4" />
        خروج
      </button>
    </div>
  );
}
