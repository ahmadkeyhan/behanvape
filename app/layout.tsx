import type { Metadata, Viewport } from "next";
import "./globals.css";
import { sans } from "@/lib/font";
import { Providers } from "@/components/Providers";
import { AppHeader } from "@/components/header/AppHeader";

export const metadata: Metadata = {
  title: {
    default: "BehanVape | بهان‌ویپ",
    template: "%s | BehanVape",
  },
  description: "کاتالوگ دیجیتال بهان‌ویپ — جویس، ویپ، پاد، سیگار الکترونیکی و لوازم جانبی",
  applicationName: "BehanVape",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BehanVape",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={sans.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
