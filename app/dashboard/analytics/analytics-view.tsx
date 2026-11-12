"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, Stat } from "@/components/app/bits";
import { ExportMenu } from "@/components/app/export-menu";
import { classColor } from "@/lib/colors";
import { useHistory } from "@/lib/history";
import { summarise } from "@/lib/stats";
import { cn, formatMs } from "@/lib/utils";

function Panel({ title, note, children, className }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-surface p-4 sm:p-5", className)} aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {note && <span className="readout text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function AnalyticsView() {
  const { ready, records } = useHistory();
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [now] = useState(() => Date.now());
  const s = summarise(records, range, now);

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <EmptyState
        title="No data to chart yet"
        action={
          <Link href="/dashboard/webcam" className="inline-flex h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground">
            Start a live scan
          </Link>
        }
      >
        Analytics are computed from your scan history on this device: activity per day, class frequency, confidence spread and inference speed.
      </EmptyState>
    );
  }

  const maxDay = Math.max(1, ...s.perDay.map((d) => d.objects));
  const maxHist = Math.max(1, ...s.histogram);
  const top = s.labelCounts.slice(0, 12);
  const maxTop = top[0]?.[1] ?? 1;
  const maxBackend = Math.max(1, ...s.byBackend.map((b) => b.median));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Date range" className="inline-grid grid-cols-3 rounded-sm border border-border-strong p-0.5">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={range === d}
              onClick={() => setRange(d)}
              className={cn(
                "h-10 rounded-xs px-4 readout text-sm transition-colors",
                range === d ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
        <ExportMenu records={records} label="Export data" />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        <Stat label="Scans" value={s.scans} />
        <Stat label="Objects" value={s.objects} />
        <Stat label="Classes seen" value={s.classes} hint="of 80" />
        <Stat label="Avg confidence" value={s.avgConfidence * 100} format={(n) => `${n.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel title="Objects per day" note={`last ${range} days`} className="lg:col-span-3">
          <div className="flex h-48 items-end gap-[3px]" role="img" aria-label={`Objects detected per day over the last ${range} days`}>
            {s.perDay.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-[1px] bg-primary/85 transition-colors group-hover:bg-primary"
                  style={{ height: `${(d.objects / maxDay) * 100}%`, minHeight: d.scans ? 2 : 0 }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-xs bg-foreground px-1.5 py-0.5 readout text-[0.6875rem] text-background group-hover:block">
                  {d.label}: {d.objects} obj · {d.scans} scans
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between readout text-[0.6875rem] text-muted-foreground">
            <span>{s.perDay[0]?.label}</span>
            <span>{s.perDay[Math.floor(s.perDay.length / 2)]?.label}</span>
            <span>{s.perDay.at(-1)?.label}</span>
          </div>
        </Panel>

        <Panel title="Confidence spread" note="all kept objects" className="lg:col-span-2">
          <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Histogram of confidence scores from 0.2 to 1.0">
            {s.histogram.map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="readout text-[0.6875rem] text-muted-foreground">{n || ""}</span>
                <div className="w-full rounded-t-[1px] bg-accent/80" style={{ height: `${(n / maxHist) * 85}%`, minHeight: n ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-8 readout text-[0.6875rem] text-muted-foreground">
            {s.histogram.map((_, i) => (
              <span key={i} className="text-center">.{i + 2}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Class frequency" note={`top ${top.length} of ${s.classes}`} className="lg:col-span-3">
          <ul className="space-y-2">
            {top.map(([label, n]) => (
              <li key={label} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-[1px]" style={{ background: classColor(label) }} aria-hidden />
                  <span className="truncate">{label}</span>
                </span>
                <span className="relative h-2 overflow-hidden rounded-xs bg-surface-2" aria-hidden>
                  <span className="absolute inset-y-0 left-0" style={{ width: `${(n / maxTop) * 100}%`, background: classColor(label) }} />
                </span>
                <span className="readout text-right text-xs text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Inference speed" note="median per scan" className="lg:col-span-2">
          <ul className="space-y-3">
            {s.byBackend.map((b) => (
              <li key={b.backend}>
                <div className="flex justify-between text-sm">
                  <span className="readout">{b.backend}</span>
                  <span className="readout text-muted-foreground">{formatMs(b.median)} · n={b.n}</span>
                </div>
                <span className="relative mt-1.5 block h-2 overflow-hidden rounded-xs bg-surface-2" aria-hidden>
                  <span className="absolute inset-y-0 left-0 bg-foreground/70" style={{ width: `${(b.median / maxBackend) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
            {(["camera", "upload", "video"] as const).map((k) => (
              <div key={k}>
                <dt className="readout text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-1 font-display text-xl font-semibold">{s.bySource[k] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
