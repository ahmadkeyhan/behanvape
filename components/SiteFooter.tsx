"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Instagram, MapPin } from "lucide-react";

// ── Owner placeholders: fill these in ──────────────────────────────
const INSTAGRAM_URL = "https://instagram.com/"; // TODO: آدرس اینستاگرام فروشگاه را اینجا بگذارید
const STORE_ADDRESS = "تبریز / پرواز / شهید بابائی 2"; // TODO: آدرس فروشگاه
// Google Maps embed (provided)
const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d467.09538490882807!2d46.36521210518816!3d38.04171103858651!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x401a1b0066aa9399%3A0x4dc7ab61a307cfc4!2z2YjbjNm-INi02KfZviDYqNmH2KfZhiDZiNuM2b4!5e0!3m2!1sen!2s!4v1781737127969!5m2!1sen!2s";
// ───────────────────────────────────────────────────────────────────

export function SiteFooter() {
  const pathname = usePathname();
  // Visible on all routes except the admin dashboard and login.
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-12 border-t border-border/60">
      <div className="container flex flex-col items-center gap-5 py-10 text-center">
        {/* logo + wordmark */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/violetLogo.png"
            alt="لوگوی بهان‌ویپ"
            width={48}
            height={48}
            className="h-12 w-12"
          />
          <span className="text-2xl font-bold tracking-tight">
            Behan<span className="text-gradient">Vape</span>
          </span>
        </div>

        {/* instagram */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Instagram className="h-5 w-5" />
          اینستاگرام
        </a>

        {/* embedded map */}
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border">
          <iframe
            src={MAP_EMBED_SRC}
            title="موقعیت فروشگاه روی نقشه"
            className="w-full aspect-video sm:h-80"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* address */}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          {STORE_ADDRESS}
        </p>

        {/* 18+ warning */}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md border border-border px-2 py-0.5 text-xs">۱۸+</span>
          فروش به افراد زیر ۱۸ سال ممنوع است.
        </p>
      </div>
    </footer>
  );
}
