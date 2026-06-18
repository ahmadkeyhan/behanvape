"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Dependency-free dual-handle slider (pointer + keyboard, ARIA). Always LTR
// (numeric: min on the left) regardless of the surrounding RTL layout.
interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  className?: string;
  minLabel?: string;
  maxLabel?: string;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function decimalsOf(step: number) {
  const s = String(step);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  onValueCommit,
  className,
  minLabel = "حداقل",
  maxLabel = "حداکثر",
}: RangeSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<0 | 1 | null>(null);
  const decimals = decimalsOf(step);
  const span = max - min || 1;

  const pct = (v: number) => clamp(((v - min) / span) * 100, 0, 100);

  const snap = (raw: number) => {
    const snapped = Math.round((raw - min) / step) * step + min;
    return Number(clamp(snapped, min, max).toFixed(decimals));
  };

  const apply = (which: 0 | 1, v: number, commit: boolean) => {
    let [lo, hi] = value;
    if (which === 0) lo = clamp(v, min, hi);
    else hi = clamp(v, lo, max);
    const next: [number, number] = [lo, hi];
    onValueChange?.(next);
    if (commit) onValueCommit?.(next);
  };

  const valueFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return snap(min + ratio * span);
  };

  const onPointerDown = (which: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = which;
  };

  const onPointerMove = (which: 0 | 1) => (e: React.PointerEvent) => {
    if (dragging.current !== which) return;
    apply(which, valueFromClientX(e.clientX), false);
  };

  const onPointerUp = (which: 0 | 1) => (e: React.PointerEvent) => {
    if (dragging.current !== which) return;
    dragging.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    apply(which, valueFromClientX(e.clientX), true);
  };

  const onKeyDown = (which: 0 | 1) => (e: React.KeyboardEvent) => {
    let next: number | null = null;
    const cur = value[which];
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = snap(cur - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = snap(cur + step);
        break;
      case "Home":
        next = which === 0 ? min : value[0];
        break;
      case "End":
        next = which === 0 ? value[1] : max;
        break;
      default:
        return;
    }
    e.preventDefault();
    apply(which, next, true);
  };

  const thumbBase =
    "absolute top-1/2 block h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-primary/60 bg-primary shadow outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none";

  return (
    <div
      dir="ltr"
      className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
    >
      <div ref={trackRef} className="relative h-1.5 w-full rounded-full bg-secondary">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        {([0, 1] as const).map((which) => (
          <button
            key={which}
            type="button"
            role="slider"
            aria-label={which === 0 ? minLabel : maxLabel}
            aria-valuemin={which === 0 ? min : value[0]}
            aria-valuemax={which === 0 ? value[1] : max}
            aria-valuenow={value[which]}
            tabIndex={0}
            onPointerDown={onPointerDown(which)}
            onPointerMove={onPointerMove(which)}
            onPointerUp={onPointerUp(which)}
            onKeyDown={onKeyDown(which)}
            style={{ left: `${pct(value[which])}%` }}
            className={thumbBase}
          />
        ))}
      </div>
    </div>
  );
}
