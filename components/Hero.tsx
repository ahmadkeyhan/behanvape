"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute w-full h-full">
        <Image src="/hero.jpg" fill alt="hero image" className=" object-cover opacity-40" />
      </div>
      {/* Signature moment: soft violet vapor blobs drifting behind the wordmark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">
        <div className="vapor-blob -top-24 start-[-4rem] h-80 w-80 bg-primary/25 animate-vapor-drift" />
        <div
          className="vapor-blob top-10 end-[-3rem] h-72 w-72 bg-fuchsia-600/20 animate-vapor-drift"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="vapor-blob bottom-[-6rem] start-1/3 h-72 w-72 bg-violet-500/15 animate-vapor-drift"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container relative flex flex-col items-center gap-6 py-16 px-8 text-center"
      >
        <motion.span
          variants={item}
          className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          تجربه‌ای متفاوت از دنیای ویپ
        </motion.span>
        <motion.h1
          variants={item}
          className="text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Behan<span className="text-gradient">Vape</span>
        </motion.h1>
        <motion.p
          variants={item}
          className="max-w-xl text-base leading-8 text-foreground sm:text-lg"
        >
          جدیدترین جویس‌ها، ویپ‌ها، پادها و لوازم جانبی با کیفیت و اصالت تضمین‌شده
        </motion.p>
        <motion.div variants={item}>
          <Button asChild size="lg">
            <Link href="/products">
              مشاهدهٔ محصولات
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
