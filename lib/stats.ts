import { visible } from "./history";
import type { ScanRecord } from "./types";
import { median } from "./utils";

export interface Summary {
  scans: number;
  objects: number;
  avgConfidence: number;
  medianLatency: number;
  classes: number;
  labelCounts: [string, number][];
  perDay: { day: string; label: string; scans: number; objects: number }[];
  histogram: number[];
  bySource: Record<string, number>;
  byBackend: { backend: string; median: number; n: number }[];
}

export function summarise(records: ScanRecord[], days = 14, now = Date.now()): Summary {
  const all = records.flatMap((r) => visible(r));
  const labelMap = new Map<string, number>();
  all.forEach((d) => labelMap.set(d.label, (labelMap.get(d.label) ?? 0) + 1));

  const perDay: Summary["perDay"] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    perDay.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      scans: 0,
      objects: 0,
    });
  }
  const index = new Map(perDay.map((p, i) => [p.day, i]));
  records.forEach((r) => {
    const d = new Date(r.createdAt);
    d.setHours(0, 0, 0, 0);
    // Keys are local midnights serialised the same way as above, so time zones line up.
    const j = index.get(d.toISOString().slice(0, 10));
    if (j !== undefined) {
      perDay[j].scans++;
      perDay[j].objects += visible(r).length;
    }
  });

  const histogram = Array.from({ length: 8 }, () => 0); // 0.2–1.0 in 0.1 bins
  all.forEach((d) => {
    const bin = Math.min(7, Math.max(0, Math.floor((d.score - 0.2) / 0.1)));
    histogram[bin]++;
  });

  const bySource: Record<string, number> = {};
  records.forEach((r) => (bySource[r.source] = (bySource[r.source] ?? 0) + 1));

  const backendMap = new Map<string, number[]>();
  records
    .filter((r) => r.latencyMs > 0)
    .forEach((r) => backendMap.set(r.backend, [...(backendMap.get(r.backend) ?? []), r.latencyMs]));

  return {
    scans: records.length,
    objects: all.length,
    avgConfidence: all.length ? all.reduce((a, d) => a + d.score, 0) / all.length : 0,
    medianLatency: median(records.filter((r) => r.latencyMs > 0).map((r) => r.latencyMs)),
    classes: labelMap.size,
    labelCounts: [...labelMap.entries()].sort((a, b) => b[1] - a[1]),
    perDay,
    histogram,
    bySource,
    byBackend: [...backendMap.entries()].map(([backend, v]) => ({ backend, median: median(v), n: v.length })),
  };
}
