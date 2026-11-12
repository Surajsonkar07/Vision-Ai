"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Aperture, Film, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { detect, useDetector } from "@/lib/detector";
import { drawDetections, toCanvas } from "@/lib/image";
import { persistScan } from "@/lib/scan";
import { useSettings, visibleFor } from "@/lib/settings";
import type { Detection } from "@/lib/types";
import { formatBytes, formatMs } from "@/lib/utils";

/** Plays a local video and runs detection on each displayed frame. */
export function VideoAnalyzer({ file, url, onClose }: { file: File; url: string; onClose: () => void }) {
  const settings = useSettings();
  const detector = useDetector();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rawRef = useRef<Detection[]>([]);
  const latencyRef = useRef(0);
  const settingsRef = useRef(settings);
  const [readout, setReadout] = useState({ count: 0, latency: 0 });
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const analyseFrame = useCallback(async () => {
    const v = videoRef.current;
    const c = overlayRef.current;
    if (!v || !c || v.readyState < 2) return;
    const s = settingsRef.current;
    const { detections, latencyMs } = await detect(v, s.model, s.maxBoxes);
    rawRef.current = detections;
    latencyRef.current = latencyMs;
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
    }
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const shown = visibleFor(detections, s.threshold, s.classFilter);
    drawDetections(ctx, shown, { showLabels: s.showLabels });
    setReadout({ count: shown.length, latency: latencyMs });
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let running = true;
    let busy = false;
    const tick = async () => {
      if (!running) return;
      if (!v.paused && !v.ended && !busy) {
        busy = true;
        try {
          await analyseFrame();
        } catch {
          /* model still loading */
        }
        busy = false;
      }
      requestAnimationFrame(() => void tick());
    };
    void tick();
    const onSeek = () => void analyseFrame().catch(() => {});
    v.addEventListener("seeked", onSeek);
    v.addEventListener("loadeddata", onSeek);
    return () => {
      running = false;
      v.removeEventListener("seeked", onSeek);
      v.removeEventListener("loadeddata", onSeek);
    };
  }, [analyseFrame]);

  // Re-draw when the threshold changes while paused.
  useEffect(() => {
    const c = overlayRef.current;
    if (!c || !c.width) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    drawDetections(ctx, visibleFor(rawRef.current, settings.threshold, settings.classFilter), { showLabels: settings.showLabels });
  }, [settings.threshold, settings.showLabels, settings.classFilter]);

  const capture = async () => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const canvas = toCanvas(v, v.videoWidth, v.videoHeight);
    const k = canvas.width / v.videoWidth;
    const detections = rawRef.current.map((d) => ({
      ...d,
      bbox: d.bbox.map((n) => n * k) as Detection["bbox"],
    }));
    const t = v.currentTime;
    await persistScan({
      canvas,
      detections,
      threshold: settings.threshold,
      latencyMs: latencyRef.current,
      source: "video",
      name: `${file.name} @ ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`,
    });
    setSaved((n) => n + 1);
    toast.success("Video frame saved to history");
  };

  return (
    <section aria-labelledby="video-title" className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id="video-title" className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Film className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{file.name}</span>
          <span className="readout shrink-0 text-xs font-normal text-muted-foreground">{formatBytes(file.size)}</span>
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close video" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="space-y-3 p-4">
        <div className="frame-corners relative aspect-video overflow-hidden border border-border bg-[oklch(0.13_0.008_255)]">
          <video ref={videoRef} src={url} controls playsInline muted className="absolute inset-0 size-full object-contain" />
          <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 size-full object-contain" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="readout text-xs text-muted-foreground" aria-live="polite">
            {detector.status === "ready"
              ? `${readout.count} objects · ${formatMs(readout.latency)} · play or scrub to analyse`
              : `${detector.stage || "Loading detector"}…`}
            {saved ? ` · ${saved} saved` : ""}
          </p>
          <Button onClick={() => void capture()} disabled={detector.status !== "ready"}>
            <Aperture /> Capture frame
          </Button>
        </div>
      </div>
    </section>
  );
}
