"use client";

import { canvasToBlob, thumbnail } from "./image";
import { saveScan } from "./history";
import { sessionStore, syncScan } from "./cloud";
import { detectorStore, modelLabel } from "./detector";
import type { AiAnalysis, Detection, ScanRecord, ScanSource } from "./types";
import { uid } from "./utils";

/** Builds a record from the analysed canvas, stores it locally and mirrors it to the cloud if signed in. */
export async function persistScan(opts: {
  canvas: HTMLCanvasElement;
  detections: Detection[];
  threshold: number;
  latencyMs: number;
  source: ScanSource;
  name: string;
  ai?: AiAnalysis;
  id?: string;
}): Promise<ScanRecord> {
  const d = detectorStore.get();
  const record: ScanRecord = {
    id: opts.id ?? uid(),
    createdAt: Date.now(),
    source: opts.source,
    name: opts.name,
    width: opts.canvas.width,
    height: opts.canvas.height,
    thumb: thumbnail(opts.canvas),
    detections: opts.detections,
    threshold: opts.threshold,
    latencyMs: opts.latencyMs,
    model: modelLabel(d.base),
    backend: d.backend ?? "unknown",
    ai: opts.ai,
  };
  const blob = await canvasToBlob(opts.canvas);
  await saveScan(record, blob);
  if (sessionStore.get().user) void syncScan(record);
  return record;
}
