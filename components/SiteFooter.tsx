export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          <span className="font-bold text-foreground">BehanVape</span> — کاتالوگ دیجیتال محصولات
        </p>
        <p className="flex items-center gap-2">
          <span className="rounded-md border border-border px-2 py-0.5 text-xs">۱۸+</span>
          فروش به افراد زیر ۱۸ سال ممنوع است.
        </p>
      </div>
    </footer>
  );
}
