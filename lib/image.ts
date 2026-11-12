"use client";

import { classColor, LABEL_INK } from "./colors";
import type { Detection } from "./types";

export const MAX_SIDE = 1280;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file could not be read as an image."));
    img.src = src;
  });
}

/** Draws any image-like source to a canvas no larger than `max` on its long side. */
export function toCanvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  max = MAX_SIDE,
  mirror = false,
): HTMLCanvasElement {
  const scale = Math.min(1, max / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.86): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image."))), type, quality),
  );
}

export function thumbnail(canvas: HTMLCanvasElement, max = 320): string {
  const t = toCanvas(canvas, canvas.width, canvas.height, max);
  return t.toDataURL("image/jpeg", 0.72);
}

function monoFont(px: number) {
  const family =
    typeof document !== "undefined"
      ? getComputedStyle(document.body).getPropertyValue("--font-plex-mono").trim() || "monospace"
      : "monospace";
  return `500 ${px}px ${family}, ui-monospace, monospace`;
}

/**
 * Draws boxes in the canvas' own pixel space. `scale` maps detection coordinates to canvas pixels.
 */
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  opts: { scale?: number; showLabels?: boolean; mirrorWidth?: number; highlight?: number } = {},
) {
  const { scale = 1, showLabels = true, mirrorWidth, highlight } = opts;
  const base = Math.max(ctx.canvas.width, ctx.canvas.height);
  const line = Math.max(1.5, base / 480);
  const fontPx = Math.max(11, Math.round(base / 64));
  const tick = Math.max(8, base / 60);
  ctx.save();
  ctx.font = monoFont(fontPx);
  ctx.textBaseline = "middle";

  detections.forEach((d, i) => {
    const [bx, y, w, h] = d.bbox.map((v) => v * scale);
    const x = mirrorWidth ? mirrorWidth - bx - w : bx;
    const color = classColor(d.label);
    const dim = highlight !== undefined && highlight !== i;
    ctx.globalAlpha = dim ? 0.35 : 1;

    ctx.lineWidth = line;
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, w, h);

    // Heavier corner ticks: the "lock-on" signature
    ctx.lineWidth = line * 2;
    const t = Math.min(tick, w / 3, h / 3);
    ctx.beginPath();
    ctx.moveTo(x, y + t); ctx.lineTo(x, y); ctx.lineTo(x + t, y);
    ctx.moveTo(x + w - t, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + t);
    ctx.moveTo(x + w, y + h - t); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - t, y + h);
    ctx.moveTo(x + t, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - t);
    ctx.stroke();

    if (showLabels) {
      const text = `${d.label} ${Math.round(d.score * 100)}%`;
      const padX = fontPx * 0.5;
      const tw = ctx.measureText(text).width + padX * 2;
      const th = fontPx * 1.6;
      const ty = y - th >= 0 ? y - th : y;
      const tx = Math.min(Math.max(0, x - line / 2), ctx.canvas.width - tw);
      ctx.fillStyle = color;
      ctx.fillRect(tx, ty, tw, th);
      ctx.fillStyle = LABEL_INK;
      ctx.fillText(text, tx + padX, ty + th / 2 + 0.5);
    }
  });
  ctx.restore();
}

/** Full-resolution PNG with boxes burned in, for export. */
export async function annotatedPng(src: string, detections: Detection[], sourceWidth: number): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  drawDetections(ctx, detections, { scale: img.naturalWidth / sourceWidth });
  return canvasToBlob(canvas, "image/png");
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
