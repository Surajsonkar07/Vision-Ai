"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Camera, ImageUp } from "lucide-react";
import { EmptyState, Stat } from "@/components/app/bits";
import { ModelStatus } from "@/components/app/model-status";
import { classColor } from "@/lib/colors";
import { useHistory, visible } from "@/lib/history";
import { useSession } from "@/lib/cloud";
import { summarise } from "@/lib/stats";
import { formatDate, formatMs, pct } from "@/lib/utils";

function greeting(h: number) {
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Overview() {
  const { ready, records } = useHistory();
  const { user } = useSession();
  const [now] = useState(() => Date.now());
  const s = summarise(records, 14, now);
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const recent = records.slice(0, 6);
  const maxLabel = s.labelCounts[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow" suppressHydrationWarning>
            {greeting(new Date(now).getHours())}
            {name ? `, ${name}` : ""}
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-[2.125rem]">Detection console</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {ready && records.length
              ? `${s.scans} scans and ${s.objects} objects recorded across ${s.classes} classes.`
              : "Start with the live camera or drop in a photo. Results stay on this device."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href="/dashboard/webcam"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Camera className="size-4" aria-hidden /> Live scan
          </Link>
          <Link
            href="/dashboard/upload"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            <ImageUp className="size-4" aria-hidden /> Upload
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        <Stat label="Scans" value={s.scans} hint={`${s.bySource.camera ?? 0} camera · ${s.bySource.upload ?? 0} upload`} />
        <Stat label="Objects" value={s.objects} hint={`${s.classes} distinct classes`} />
        <Stat label="Avg confidence" value={s.avgConfidence * 100} format={(n) => `${n.toFixed(1)}%`} hint="above threshold" />
        <Stat label="Median inference" value={s.medianLatency} format={(n) => (s.medianLatency ? formatMs(n) : "—")} hint="per frame" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="recent-title" className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-title" className="text-lg font-semibold">Recent scans</h2>
            {records.length > 0 && (
              <Link href="/dashboard/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                All history <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
          {!ready ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[4/3]" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState title="Nothing scanned yet">
              Your first capture or upload will show up here with its labels and confidence scores.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {recent.map((r) => {
                const n = visible(r).length;
                return (
                  <li key={r.id}>
                    <Link href={`/dashboard/history/${r.id}`} className="group block overflow-hidden rounded-md border border-border bg-surface hover:border-border-strong">
                      <div className="aspect-[4/3] overflow-hidden bg-surface-2">
                        {r.thumb && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.thumb} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="readout text-xs">{n} obj</span>
                        <span className="readout truncate text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <ModelStatus />
          <section aria-labelledby="top-title" className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 id="top-title" className="text-sm font-semibold">Most detected</h2>
              <Link href="/dashboard/analytics" className="readout text-xs text-muted-foreground hover:text-foreground">
                analytics →
              </Link>
            </div>
            {s.labelCounts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Class counts appear after your first scan.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {s.labelCounts.slice(0, 6).map(([label, count]) => (
                  <li key={label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-sm">
                    <span className="truncate">{label}</span>
                    <span className="relative h-1.5 overflow-hidden rounded-xs bg-border" aria-hidden>
                      <span className="absolute inset-y-0 left-0" style={{ width: `${(count / maxLabel) * 100}%`, background: classColor(label) }} />
                    </span>
                    <span className="readout text-right text-xs text-muted-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.objects > 0 && (
              <p className="readout mt-3 text-xs text-muted-foreground">
                top class = {pct((s.labelCounts[0]?.[1] ?? 0) / s.objects)} of objects
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
