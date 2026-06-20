"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductsMenu, type HeaderCategory } from "@/components/header/ProductsMenu";
import { NotificationToggle } from "@/components/header/NotificationToggle";
import { PwaInstallButton } from "@/components/header/PwaInstallButton";
import { AccountControls } from "@/components/header/AccountControls";

const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <span className="relative block h-9 w-9">
      <Image src="/violetLogo.png" alt="لوگوی بهان‌ویپ" width={36} height={36} className="h-9 w-9" />
    </span>
    <span className="text-xl font-bold tracking-tight">
      Behan<span className="text-gradient">Vape</span>
    </span>
  </Link>
);

export function AppHeader() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) setCategories(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Per decision: the header is excluded from the focused login screen.
  if (pathname === "/admin/login") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Logo />

        {/* Desktop: inline controls */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            خانه
          </Link>
          <ProductsMenu categories={categories} variant="dropdown" />
          <NotificationToggle compact />
          <PwaInstallButton compact />
          <div className="ms-1">
            <AccountControls compact />
          </div>
        </nav>

        {/* Mobile: hamburger -> sidebar drawer */}
        <div className="md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="منو">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" className="w-80 max-w-[85vw] overflow-y-auto">
              <SheetHeader className="mb-4 text-start">
                <SheetTitle>منو</SheetTitle>
              </SheetHeader>

              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setSheetOpen(false)}
                  className="block rounded-md px-2 py-2 text-base font-medium hover:bg-accent"
                >
                  خانه
                </Link>

                <ProductsMenu
                  categories={categories}
                  variant="list"
                  onNavigate={() => setSheetOpen(false)}
                />

                <div className="my-2 h-px bg-border" />

                <NotificationToggle />
                <PwaInstallButton />

                <div className="my-2 h-px bg-border" />

                <AccountControls onNavigate={() => setSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
