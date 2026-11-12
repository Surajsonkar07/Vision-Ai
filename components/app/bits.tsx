"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-[2.125rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Counts up to `value` once when it first renders; instant when reduced motion is on. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === value) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={cn("tabular-nums", className)}>{format(shown)}</span>;
}

export function Stat({
  label,
  value,
  format,
  hint,
  className,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-surface p-4 sm:p-5", className)}>
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none [font-stretch:112%] sm:text-[2rem]">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="readout mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "frame-corners flex flex-col items-start gap-3 border border-dashed border-border-strong bg-surface/60 p-6 sm:p-8",
        className,
      )}
    >
      <p className="readout text-xs text-muted-foreground">0 records</p>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="max-w-prose text-sm text-muted-foreground">{children}</div>}
      {action}
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <span className="relative block h-1 w-full overflow-hidden rounded-xs bg-border" aria-hidden>
      <span className="absolute inset-y-0 left-0" style={{ width: `${score * 100}%`, background: `var(--c, var(--primary))` }} data-label={label} />
    </span>
  );
}
