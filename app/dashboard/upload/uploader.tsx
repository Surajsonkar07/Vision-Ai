"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, ClipboardPaste, ExternalLink, ImageUp, Loader2, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label, Slider } from "@/components/ui/form-controls";
import { AiPanel } from "@/components/app/ai-panel";
import { ExportMenu } from "@/components/app/export-menu";
import { ClassSummary, DetectionTable, Stage } from "@/components/app/stage";
import { detect, scheduleLoad, useDetector, modelLabel } from "@/lib/detector";
import { annotatedPng, loadImage, toCanvas } from "@/lib/image";
import { download, slug } from "@/lib/export";
import { updateScan } from "@/lib/history";
import { persistScan } from "@/lib/scan";
import { updateSettings, useSettings, visibleFor } from "@/lib/settings";
import { ClassFilterBadge } from "@/components/app/class-filter";
import type { AiAnalysis, Detection, ScanRecord } from "@/lib/types";
import { cn, formatBytes, formatMs, uid } from "@/lib/utils";
import { VideoAnalyzer } from "./video-analyzer";

type Status = "queued" | "running" | "done" | "error";

interface Item {
  id: string;
  file: File;
  url: string;
  addedAt: number;
  status: Status;
  width: number;
  height: number;
  detections: Detection[];
  latencyMs: number;
  saved?: ScanRecord;
  ai?: AiAnalysis;
  error?: string;
}

const MAX_BYTES = 50 * 1024 * 1024;

export function Uploader() {
  const settings = useSettings();
  const detector = useDetector();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [video, setVideo] = useState<{ file: File; url: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvases = useRef(new Map<string, HTMLCanvasElement>());
  const processing = useRef(false);
  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => scheduleLoad(settings.model), [settings.model]);

  // Revoke object URLs when leaving the page.
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    },
    [],
  );

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const processQueue = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((i) => i.status === "queued");
        if (!next) break;
        patch(next.id, { status: "running" });
        itemsRef.current = itemsRef.current.map((i) => (i.id === next.id ? { ...i, status: "running" } : i));
        try {
          const img = await loadImage(next.url);
          const canvas = toCanvas(img, img.naturalWidth, img.naturalHeight);
          canvases.current.set(next.id, canvas);
          const s = settingsRef.current;
          const { detections, latencyMs } = await detect(canvas, s.model, s.maxBoxes);
          let saved: ScanRecord | undefined;
          if (s.autoSaveUploads) {
            saved = await persistScan({
              id: next.id,
              canvas,
              detections,
              threshold: s.threshold,
              latencyMs,
              source: "upload",
              name: next.file.name,
            });
          }
          patch(next.id, { status: "done", width: canvas.width, height: canvas.height, detections, latencyMs, saved });
        } catch (err) {
          patch(next.id, { status: "error", error: err instanceof Error ? err.message : "Detection failed." });
        }
      }
    } finally {
      processing.current = false;
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const vids = list.filter((f) => f.type.startsWith("video/"));
      const imgs = list.filter((f) => f.type.startsWith("image/"));
      const rejected = list.length - vids.length - imgs.length;
      if (rejected) toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped`, { description: "Only images and videos are supported." });
      const tooBig = imgs.filter((f) => f.size > MAX_BYTES);
      if (tooBig.length) toast.error("Some images are over 50 MB and were skipped.");
      const fresh: Item[] = imgs
        .filter((f) => f.size <= MAX_BYTES)
        .map((file) => ({
          id: uid(),
          file,
          url: URL.createObjectURL(file),
          addedAt: Date.now(),
          status: "queued",
          width: 0,
          height: 0,
          detections: [],
          latencyMs: 0,
        }));
      if (fresh.length) {
        const merged = [...itemsRef.current, ...fresh];
        itemsRef.current = merged;
        setItems(merged);
        setSelected((s) => s ?? fresh[0].id);
        void processQueue();
      }
      if (vids[0]) {
        setVideo((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return { file: vids[0], url: URL.createObjectURL(vids[0]) };
        });
      }
    },
    [processQueue],
  );

  // Paste images from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const remove = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.url);
    canvases.current.delete(id);
    setItems((list) => list.filter((i) => i.id !== id));
    if (selected === id) setSelected(items.find((i) => i.id !== id)?.id ?? null);
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    canvases.current.clear();
    setItems([]);
    setSelected(null);
  };

  const current = items.find((i) => i.id === selected) ?? null;
  const shown = current ? visibleFor(current.detections, settings.threshold, settings.classFilter) : [];

  const recordFor = (item: Item): ScanRecord =>
    item.saved
      ? { ...item.saved, threshold: settings.threshold }
      : {
          id: item.id,
          createdAt: item.addedAt,
          source: "upload",
          name: item.file.name,
          width: item.width,
          height: item.height,
          thumb: "",
          detections: item.detections,
          threshold: settings.threshold,
          latencyMs: item.latencyMs,
          model: modelLabel(detector.base),
          backend: detector.backend ?? "unknown",
          ai: item.ai,
        };

  const saveCurrent = async () => {
    if (!current) return;
    const canvas = canvases.current.get(current.id);
    if (!canvas) return;
    if (current.saved) {
      await updateScan(current.id, { threshold: settings.threshold, ai: current.ai ?? current.saved.ai });
      patch(current.id, { saved: { ...current.saved, threshold: settings.threshold } });
      toast.success("Saved scan updated");
      return;
    }
    const saved = await persistScan({
      id: current.id,
      canvas,
      detections: current.detections,
      threshold: settings.threshold,
      latencyMs: current.latencyMs,
      source: "upload",
      name: current.file.name,
      ai: current.ai,
    });
    patch(current.id, { saved });
    toast.success("Saved to history");
  };

  const done = items.filter((i) => i.status === "done");
  const busy = items.some((i) => i.status === "running" || i.status === "queued");

  return (
    <div className="space-y-6">
      <ClassFilterBadge />
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "frame-corners relative flex flex-col items-start gap-4 border border-dashed bg-surface p-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-6",
          dragging ? "border-primary bg-primary-soft" : "border-border-strong",
        )}
      >
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-sm border border-border bg-surface-2">
            <ImageUp className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="font-medium">Drop photos or a video here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Several images at once, up to 50 MB each · <span className="hidden sm:inline">paste with Ctrl/⌘ V ·</span> files never leave this device
            </p>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            id="file-input"
            aria-label="Choose photos or a video to analyse"
            tabIndex={-1}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button className="flex-1 sm:flex-none" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <Button
            variant="secondary"
            className="hidden sm:inline-flex"
            onClick={async () => {
              try {
                const clip = await navigator.clipboard.read();
                const files: File[] = [];
                for (const it of clip) {
                  const type = it.types.find((t) => t.startsWith("image/"));
                  if (type) files.push(new File([await it.getType(type)], `pasted.${type.split("/")[1]}`, { type }));
                }
                if (files.length) addFiles(files);
                else toast.message("No image on the clipboard");
              } catch {
                toast.message("Press Ctrl/⌘ V to paste an image");
              }
            }}
          >
            <ClipboardPaste /> Paste
          </Button>
        </div>
      </div>

      {video && (
        <VideoAnalyzer
          key={video.url}
          file={video.file}
          url={video.url}
          onClose={() => {
            URL.revokeObjectURL(video.url);
            setVideo(null);
          }}
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-4">
            {/* Queue strip */}
            <div className="flex items-center justify-between gap-3">
              <p className="readout text-xs text-muted-foreground" aria-live="polite">
                {done.length}/{items.length} analysed{busy ? " · working…" : ""}
              </p>
              <div className="flex items-center gap-2">
                <ExportMenu records={done.map(recordFor)} label="Export all" />
                <Button variant="ghost" size="icon" aria-label="Clear all results" onClick={clearAll}>
                  <Trash2 />
                </Button>
              </div>
            </div>
            <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Uploaded images">
              <AnimatePresence initial={false}>
                {items.map((it) => {
                  const n = visibleFor(it.detections, settings.threshold, settings.classFilter).length;
                  return (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(it.id)}
                        aria-pressed={it.id === selected}
                        aria-label={`${it.file.name}, ${it.status === "done" ? `${n} objects` : it.status}`}
                        className={cn(
                          "relative block h-20 w-28 overflow-hidden rounded-sm border-2 transition-colors",
                          it.id === selected ? "border-primary" : "border-transparent hover:border-border-strong",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.url} alt="" className="size-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 px-1.5 py-0.5 readout text-[0.6875rem] text-white">
                          {it.status === "done" && <>{n} obj</>}
                          {it.status === "running" && <Loader2 className="size-3 animate-spin" />}
                          {it.status === "queued" && "queued"}
                          {it.status === "error" && <AlertTriangle className="size-3" />}
                          {it.saved && <Check className="size-3" aria-label="saved" />}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {current && (
              <div className="space-y-3">
                {current.status === "done" ? (
                  <Stage
                    src={current.url}
                    width={current.width}
                    height={current.height}
                    detections={shown}
                    showLabels={settings.showLabels}
                    highlight={highlight}
                    onHighlight={setHighlight}
                    alt={`${current.file.name} with ${shown.length} detected objects`}
                  />
                ) : (
                  <div className="frame-corners relative grid aspect-video place-items-center overflow-hidden border border-border bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.url} alt={current.file.name} className="absolute inset-0 size-full object-contain opacity-50" />
                    <p className="relative inline-flex items-center gap-2 bg-background/90 px-3 py-2 readout text-xs" role="status">
                      {current.status === "error" ? (
                        <>
                          <AlertTriangle className="size-4 text-destructive" /> {current.error}
                        </>
                      ) : (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {detector.status === "ready" ? "Detecting…" : `${detector.stage || "Loading detector"}…`}
                        </>
                      )}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate readout text-xs text-muted-foreground">
                    {current.file.name} · {formatBytes(current.file.size)}
                    {current.status === "done" && ` · ${current.width}×${current.height} · ${formatMs(current.latencyMs)}`}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => remove(current.id)}>
                    <X /> Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Result panel */}
          {current && current.status === "done" && (
            <div className="min-w-0 space-y-4">
              <section aria-labelledby="result-title" className="space-y-4 rounded-md border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="result-title" className="text-sm font-semibold">
                    {shown.length} object{shown.length === 1 ? "" : "s"}
                  </h2>
                  {current.saved ? (
                    <Link href={`/dashboard/history/${current.id}`} className="inline-flex items-center gap-1 readout text-xs text-muted-foreground hover:text-foreground">
                      saved <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    <span className="readout text-xs text-muted-foreground">not saved</span>
                  )}
                </div>
                <ClassSummary detections={shown} />
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="up-threshold">Confidence threshold</Label>
                    <span className="readout text-sm">{settings.threshold.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="up-threshold"
                    aria-label="Confidence threshold"
                    min={0.2}
                    max={0.95}
                    step={0.05}
                    value={[settings.threshold]}
                    onValueChange={([v]) => updateSettings({ threshold: v })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={current.saved && current.saved.threshold === settings.threshold ? "secondary" : "primary"}
                    onClick={() => void saveCurrent()}
                    disabled={!!current.saved && current.saved.threshold === settings.threshold && current.saved.ai === current.ai}
                  >
                    <Save /> {current.saved ? "Update" : "Save"}
                  </Button>
                  <ExportMenu
                    records={[recordFor(current)]}
                    onPng={async () => {
                      const png = await annotatedPng(current.url, shown, current.width);
                      download(png, `${slug(current.file.name)}-annotated.png`);
                      toast.success("Annotated PNG downloaded");
                    }}
                  />
                </div>
              </section>
              <DetectionTable detections={shown} highlight={highlight} onHighlight={setHighlight} />
              <AiPanel
                result={current.ai}
                getImage={async () => canvases.current.get(current.id)?.toDataURL("image/jpeg", 0.85) ?? null}
                onResult={(r) => {
                  patch(current.id, { ai: r, saved: current.saved ? { ...current.saved, ai: r } : undefined });
                  if (current.saved) void updateScan(current.id, { ai: r });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
