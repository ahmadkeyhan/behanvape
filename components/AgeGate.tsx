"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// One-time client-side age check (no backend gate). Flag persists in localStorage.
const STORAGE_KEY = "behanvape:age-verified";

export function AgeGate() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Assume verified during SSR/first paint to avoid a flash + hydration mismatch; corrected on mount.
  const [verified, setVerified] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setVerified(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setVerified(true); // storage unavailable -> don't block
    }
  }, []);

  // Don't gate the admin back-office / login.
  const skip = pathname.startsWith("/admin");
  const show = mounted && !verified && !skip;

  // Lock background scroll while the gate is visible.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  function confirm() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setVerified(true);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="تأیید سن"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-background/90 p-4 backdrop-blur-md"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="vapor-blob -top-16 start-1/4 h-64 w-64 bg-primary/25 animate-vapor-drift" />
            <div
              className="vapor-blob bottom-0 end-1/4 h-56 w-56 bg-fuchsia-600/20 animate-vapor-drift"
              style={{ animationDelay: "-5s" }}
            />
          </div>

          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
          >
            <Image
              src="/violetLogo.png"
              alt=""
              width={56}
              height={56}
              className="mx-auto mb-3 h-14 w-14"
            />

            {!denied ? (
              <>
                <h2 className="text-xl font-bold">آیا بالای ۱۸ سال سن دارید؟</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  این فروشگاه محصولاتی مخصوص بزرگ‌سالان عرضه می‌کند. برای ورود، سن خود را تأیید کنید.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button size="lg" onClick={confirm}>
                    بله، بالای ۱۸ سال هستم
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => setDenied(true)}>
                    خیر
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">دسترسی مجاز نیست</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  متأسفیم، ورود به این فروشگاه تنها برای افراد بالای ۱۸ سال امکان‌پذیر است.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setDenied(false)}>
                  بازگشت
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
