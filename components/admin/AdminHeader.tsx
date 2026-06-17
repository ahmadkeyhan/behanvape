"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminHeader({
  username,
  role,
}: {
  username?: string;
  role?: "admin" | "cashier";
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">BehanVape</span>
          <Badge variant="secondary">{role === "admin" ? "مدیر" : "صندوق‌دار"}</Badge>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {username && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{username}</span>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">مشاهدهٔ سایت</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>
    </header>
  );
}
