"use client";

import { COCO_CLASSES, COCO_ID_BY_NAME } from "./coco";
import { visible } from "./history";
import type { ScanRecord } from "./types";

export function download(data: Blob | string, filename: string, type = "application/json") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

/** VisionAI JSON: full records (thumbnails included) — re-importable. */
export function exportJson(records: ScanRecord[]) {
  const payload = {
    format: "visionai.scans",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: records.length,
    scans: records.map((r) => ({ ...r, cloudOnly: undefined, remoteUrl: r.remoteUrl })),
  };
  download(JSON.stringify(payload, null, 2), `visionai-scans-${stamp()}.json`);
}

function csvCell(v: string | number | undefined) {
  const s = v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per detection above each scan's threshold. */
export function exportCsv(records: ScanRecord[]) {
  const header = [
    "scan_id", "created_at", "source", "file", "image_width", "image_height", "model", "backend",
    "latency_ms", "label", "score", "x", "y", "width", "height",
  ];
  const rows = [header.join(",")];
  for (const r of records) {
    const dets = visible(r);
    const base = [
      r.id, new Date(r.createdAt).toISOString(), r.source, r.name, r.width, r.height, r.model, r.backend,
      Math.round(r.latencyMs),
    ];
    if (!dets.length) rows.push([...base, "", "", "", "", "", ""].map(csvCell).join(","));
    for (const d of dets) {
      rows.push(
        [...base, d.label, d.score.toFixed(4), ...d.bbox.map((v) => v.toFixed(1))].map(csvCell).join(","),
      );
    }
  }
  download(rows.join("\n"), `visionai-detections-${stamp()}.csv`, "text/csv");
}

/** COCO object-detection format (images / annotations / categories). */
export function exportCoco(records: ScanRecord[]) {
  let annId = 1;
  const images = records.map((r, i) => ({
    id: i + 1,
    file_name: r.name,
    width: r.width,
    height: r.height,
    date_captured: new Date(r.createdAt).toISOString(),
    visionai_id: r.id,
  }));
  const annotations = records.flatMap((r, i) =>
    visible(r).map((d) => ({
      id: annId++,
      image_id: i + 1,
      category_id: COCO_ID_BY_NAME[d.label] ?? 0,
      bbox: d.bbox,
      area: Math.round(d.bbox[2] * d.bbox[3]),
      iscrowd: 0,
      score: Number(d.score.toFixed(4)),
    })),
  );
  const payload = {
    info: { description: "VisionAI export", date_created: new Date().toISOString(), version: "1.0" },
    images,
    annotations,
    categories: COCO_CLASSES.map((c) => ({ id: c.id, name: c.name, supercategory: c.group })),
  };
  download(JSON.stringify(payload), `visionai-coco-${stamp()}.json`);
}

export function slug(name: string) {
  return name.replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 48) || "scan";
}
