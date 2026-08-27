"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Debounced URL `?q=` search control for public + admin product lists.
 * Resets `page` when the query changes; does not scroll.
 */
export function SearchControl({
  value,
  className,
  placeholder = "جستجو…",
}: {
  /** Current `q` from the server/URL (controlled seed). */
  value?: string;
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const urlQ = value ?? sp.get("q") ?? "";
  const [draft, setDraft] = useState(urlQ);

  const spRef = useRef(sp);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  spRef.current = sp;
  pathnameRef.current = pathname;
  routerRef.current = router;

  useEffect(() => {
    setDraft(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (draft.trim() === urlQ.trim()) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(spRef.current.toString());
      const trimmed = draft.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      const path = pathnameRef.current;
      routerRef.current.push(qs ? `${path}?${qs}` : path, { scroll: false });
    }, 300);
    return () => window.clearTimeout(t);
  }, [draft, urlQ]);

  function clear() {
    setDraft("");
    const params = new URLSearchParams(sp.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className={cn("relative min-w-0 flex-1 sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-9 pe-8 ps-8"
        aria-label="جستجوی محصولات"
        type="search"
      />
      {draft ? (
        <button
          type="button"
          aria-label="پاک کردن جستجو"
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          onClick={clear}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
