"use client";

import { useEffect, useRef, useState } from "react";
import { classColor, LABEL_INK } from "@/lib/colors";
import type { Detection } from "@/lib/types";
import { cn, pct } from "@/lib/utils";

/**
 * Image with a crisp SVG overlay in the image's own coordinate space.
 * Detection coordinates are in `width` × `height` pixels.
 */
export function Stage({
  src,
  width,
  height,
  detections,
  showLabels = true,
  highlight,
  onHighlight,
  alt,
  className,
}: {
  src: string;
  width: number;
  height: number;
  detections: Detection[];
  showLabels?: boolean;
  highlight?: number | null;
  onHighlight?: (i: number | null) => void;
  alt: string;
  className?: string;
}) {
  const w = width || 640;
  const h = height || 480;
  const ref = useRef<HTMLDivElement>(null);
  const [shownWidth, setShownWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setShownWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Image px per screen px: keeps strokes and labels a constant on-screen size at any zoom.
  const unit = shownWidth ? w / shownWidth : Math.max(w, h) / 640;
  const font = 11.5 * unit;
  return (
    <div
      ref={ref}
      className={cn("frame-corners relative overflow-hidden border border-border bg-surface-2", className)}
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL / data URL */}
      <img src={src} alt={alt} className="absolute inset-0 size-full object-contain" draggable={false} />
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {detections.map((d, i) => {
          const [x, y, bw, bh] = d.bbox;
          const c = classColor(d.label);
          const dim = highlight != null && highlight !== i;
          const text = `${d.label} ${Math.round(d.score * 100)}%`;
          const tw = text.length * font * 0.62 + font;
          const th = font * 1.6;
          const ty = y - th >= 0 ? y - th : y;
          const t = Math.min(10 * unit, bw / 3, bh / 3);
          return (
            <g
              key={`${d.label}-${i}`}
              opacity={dim ? 0.3 : 1}
              className="motion-safe:animate-lock"
              style={{
                animationDelay: `${Math.min(i, 8) * 40}ms`,
                transformOrigin: `${x + bw / 2}px ${y + bh / 2}px`,
                transition: "opacity 150ms ease-out",
              }}
              onPointerEnter={onHighlight ? () => onHighlight(i) : undefined}
              onPointerLeave={onHighlight ? () => onHighlight(null) : undefined}
            >
              <rect
                x={x}
                y={y}
                width={bw}
                height={bh}
                fill={highlight === i ? classColor(d.label, 0.16) : "transparent"}
                stroke={c}
                strokeWidth={1.5 * unit}
                style={{ pointerEvents: onHighlight ? "all" : "none" }}
              />
              <path
                d={`M${x} ${y + t}V${y}h${t}M${x + bw - t} ${y}h${t}v${t}M${x + bw} ${y + bh - t}v${t}h${-t}M${x + t} ${y + bh}H${x}v${-t}`}
                fill="none"
                stroke={c}
                strokeWidth={3 * unit}
              />
              {showLabels && (
                <>
                  <rect x={Math.min(Math.max(0, x), w - tw)} y={ty} width={tw} height={th} fill={c} />
                  <text
                    x={Math.min(Math.max(0, x), w - tw) + font / 2}
                    y={ty + th / 2}
                    dominantBaseline="central"
                    fontSize={font}
                    fontFamily="var(--font-plex-mono), monospace"
                    fontWeight={500}
                    fill={LABEL_INK}
                  >
                    {text}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DetectionTable({
  detections,
  highlight,
  onHighlight,
  empty = "No objects above the threshold.",
}: {
  detections: Detection[];
  highlight?: number | null;
  onHighlight?: (i: number | null) => void;
  empty?: string;
}) {
  if (!detections.length) {
    return <p className="rounded-sm border border-dashed border-border-strong p-4 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">Detected objects with confidence and bounding box</caption>
        <thead className="bg-surface-2 text-left">
          <tr className="readout text-xs text-muted-foreground">
            <th scope="col" className="w-[44%] px-3 py-2 font-normal">label</th>
            <th scope="col" className="px-3 py-2 font-normal">score</th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal sm:table-cell">x, y, w, h</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {detections.map((d, i) => (
            <tr
              key={`${d.label}-${i}`}
              tabIndex={onHighlight ? 0 : undefined}
              onPointerEnter={() => onHighlight?.(i)}
              onPointerLeave={() => onHighlight?.(null)}
              onFocus={() => onHighlight?.(i)}
              onBlur={() => onHighlight?.(null)}
              className={cn("transition-colors outline-none", highlight === i && "bg-surface-2")}
            >
              <td className="px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[1px]" style={{ background: classColor(d.label) }} aria-hidden />
                  <span className="truncate">{d.label}</span>
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="readout w-11 shrink-0 text-xs">{pct(d.score, 1)}</span>
                  <span className="relative block h-1 w-full max-w-24 overflow-hidden rounded-xs bg-border" aria-hidden>
                    <span className="absolute inset-y-0 left-0" style={{ width: `${d.score * 100}%`, background: classColor(d.label) }} />
                  </span>
                </span>
              </td>
              <td className="readout hidden px-3 py-2.5 text-right text-xs text-muted-foreground sm:table-cell">
                {d.bbox.map((v) => Math.round(v)).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Per-class counts, e.g. "person ×2". */
export function ClassSummary({ detections }: { detections: Detection[] }) {
  const counts = detections.reduce<Record<string, number>>((acc, d) => {
    acc[d.label] = (acc[d.label] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Objects by class">
      {entries.map(([label, n]) => (
        <li key={label} className="inline-flex items-center gap-1.5 rounded-xs border border-border bg-surface px-2 py-1 text-xs">
          <span className="size-2 rounded-[1px]" style={{ background: classColor(label) }} aria-hidden />
          {label}
          <span className="readout text-muted-foreground">×{n}</span>
        </li>
      ))}
    </ul>
  );
}
