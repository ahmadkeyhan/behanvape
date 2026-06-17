import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex items-center">
          <div className="w-9 h-9 relative">
            <Image src="/violetLogo.png" alt="لوگوی بهان ویپ" width={192} height={192} />
          </div>
          <p className="text-xl font-bold tracking-tight">
            Behan<span className="text-primary">Vape</span>
          </p>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            خانه
          </Link>
          <Link
            href="/products"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            محصولات
          </Link>
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}
