"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Aperture, Camera, CameraOff, Loader2, Pause, Play, SwitchCamera, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label, Select, Slider } from "@/components/ui/form-controls";
import { AiPanel } from "@/components/app/ai-panel";
import { classColor } from "@/lib/colors";
import { detect, scheduleLoad, useDetector } from "@/lib/detector";
import { drawDetections, toCanvas } from "@/lib/image";
import { persistScan } from "@/lib/scan";
import { updateSettings, useSettings, visibleFor } from "@/lib/settings";
import { ClassFilterBadge } from "@/components/app/class-filter";
import type { AiAnalysis, Detection, ScanRecord } from "@/lib/types";
import { cn, formatMs, pct } from "@/lib/utils";

type CamState = "off" | "starting" | "on" | "error";
type Facing = "environment" | "user";

function cameraError(err: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "The camera needs a secure connection. Open VisionAI over HTTPS (or on localhost).";
  }
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow the camera for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is in use by another app. Close it and try again.";
  return err instanceof Error ? err.message : "Could not start the camera.";
}

export function LiveScanner() {
  const settings = useSettings();
  const detector = useDetector();

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const rawRef = useRef<Detection[]>([]);
  const statsRef = useRef({ fps: 0, latency: 0, last: 0 });
  const settingsRef = useRef(settings);

  const [cam, setCam] = useState<CamState>("off");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [deviceId, setDeviceId] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState("");
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState<{ fps: number; latency: number; detections: Detection[] }>({
    fps: 0,
    latency: 0,
    detections: [],
  });
  const [captures, setCaptures] = useState<ScanRecord[]>([]);
  const [flash, setFlash] = useState(0);
  const [ai, setAi] = useState<AiAnalysis | undefined>();

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Fetch the model in the background once the page has painted.
  useEffect(() => scheduleLoad(settings.model), [settings.model]);

  const mirrored = facing === "user" && settings.mirrorFront;
  const mirroredRef = useRef(mirrored);
  useEffect(() => {
    mirroredRef.current = mirrored;
  }, [mirrored]);

  const stopStream = useCallback(() => {
    runningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
    const c = overlayRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, []);

  const loop = useCallback(async () => {
    while (runningRef.current) {
      const v = videoRef.current;
      const c = overlayRef.current;
      if (!v || !c || v.readyState < 2 || pausedRef.current || document.hidden) {
        await new Promise((r) => setTimeout(r, 120));
        continue;
      }
      try {
        const s = settingsRef.current;
        const { detections, latencyMs } = await detect(v, s.model, s.maxBoxes);
        if (!runningRef.current) break;
        rawRef.current = detections;
        if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
        }
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        drawDetections(
          ctx,
          visibleFor(detections, s.threshold, s.classFilter),
          { showLabels: s.showLabels, mirrorWidth: mirroredRef.current ? c.width : undefined },
        );
        const now = performance.now();
        const st = statsRef.current;
        const inst = st.last ? 1000 / (now - st.last) : 0;
        st.fps = st.fps ? st.fps * 0.85 + inst * 0.15 : inst;
        st.latency = st.latency ? st.latency * 0.8 + latencyMs * 0.2 : latencyMs;
        st.last = now;
      } catch {
        await new Promise((r) => setTimeout(r, 400));
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
  }, []);

  const start = useCallback(
    async (opts?: { facing?: Facing; deviceId?: string }) => {
      const f = opts?.facing ?? facing;
      const id = opts?.deviceId ?? deviceId;
      setError(null);
      setCam("starting");
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot access a camera.");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: id
            ? { deviceId: { exact: id }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: f }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        const trackSettings = stream.getVideoTracks()[0]?.getSettings();
        const settingsFacing = trackSettings?.facingMode;
        if (settingsFacing === "user" || settingsFacing === "environment") setFacing(settingsFacing);
        setActiveDevice(trackSettings?.deviceId ?? "");
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === "videoinput"));
        pausedRef.current = false;
        setPaused(false);
        statsRef.current = { fps: 0, latency: 0, last: 0 };
        setCam("on");
        runningRef.current = true;
        void loop();
      } catch (err) {
        stopStream();
        setCam("error");
        setError(cameraError(err));
      }
    },
    [deviceId, facing, loop, stopStream],
  );

  const stop = useCallback(() => {
    stopStream();
    setCam("off");
    setPaused(false);
    setLive({ fps: 0, latency: 0, detections: [] });
  }, [stopStream]);

  useEffect(() => stopStream, [stopStream]);

  // Publish read-outs to React a few times a second (the canvas itself updates every frame).
  useEffect(() => {
    if (cam !== "on") return;
    const id = window.setInterval(() => {
      const s = settingsRef.current;
      setLive({
        fps: statsRef.current.fps,
        latency: statsRef.current.latency,
        detections: visibleFor(rawRef.current, s.threshold, s.classFilter).sort((a, b) => b.score - a.score),
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [cam]);

  const togglePause = useCallback(() => {
    const v = videoRef.current;
    if (!v || cam !== "on") return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) v.pause();
    else void v.play();
  }, [cam]);

  const flip = () => {
    const next: Facing = facing === "user" ? "environment" : "user";
    setFacing(next);
    setDeviceId("");
    if (cam === "on" || cam === "error") void start({ facing: next, deviceId: "" });
  };

  /** Current frame as a canvas, oriented exactly as the user sees it. */
  const frameCanvas = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return null;
    return toCanvas(v, v.videoWidth, v.videoHeight, 1280, mirroredRef.current);
  }, []);

  const capture = useCallback(async (withAi?: AiAnalysis) => {
    const v = videoRef.current;
    const canvas = frameCanvas();
    if (!v || !canvas) return;
    const s = canvas.width / v.videoWidth;
    const mirror = mirroredRef.current;
    const detections = rawRef.current.map((d) => {
      const [x, y, w, h] = d.bbox;
      const nx = mirror ? v.videoWidth - x - w : x;
      return { ...d, bbox: [nx * s, y * s, w * s, h * s] as Detection["bbox"] };
    });
    setFlash((f) => f + 1);
    try {
      const record = await persistScan({
        canvas,
        detections,
        threshold: settingsRef.current.threshold,
        latencyMs: statsRef.current.latency,
        source: "camera",
        ai: withAi,
        name: `camera-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`,
      });
      setCaptures((c) => [record, ...c].slice(0, 6));
      if (!withAi) setAi(undefined);
      const n = detections.filter((d) => d.score >= record.threshold).length;
      toast.success("Frame saved to history", { description: `${n} object${n === 1 ? "" : "s"} recorded` });
    } catch (err) {
      toast.error("Could not save the frame", { description: err instanceof Error ? err.message : undefined });
    }
  }, [frameCanvas]);

  // Keyboard: Space pauses, C captures.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (cam !== "on" || el.closest("input, textarea, select, [role='slider'], [role='combobox'], button")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePause();
      } else if (e.key.toLowerCase() === "c") {
        void capture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cam, capture, togglePause]);

  const modelLoading = cam === "on" && detector.status !== "ready";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-3">
        <ClassFilterBadge />
        {/* Viewfinder */}
        <div className="frame-corners relative aspect-[3/4] w-full overflow-hidden border border-border bg-[oklch(0.13_0.008_255)] sm:aspect-video">
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn("absolute inset-0 size-full object-contain", mirrored && "-scale-x-100", cam !== "on" && "invisible")}
          />
          <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 size-full object-contain" aria-hidden />

          {/* capture flash */}
          <AnimatePresence>
            {flash > 0 && (
              <motion.div
                key={flash}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute inset-0 bg-white"
              />
            )}
          </AnimatePresence>

          {cam === "on" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 readout text-[0.6875rem] text-white sm:text-xs">
              <span className="inline-flex items-center gap-1.5 bg-black/60 px-1.5 py-0.5">
                <span className={cn("size-1.5 rounded-full", paused ? "bg-white" : "bg-[oklch(0.73_0.16_38)] motion-safe:animate-blink")} />
                {paused ? "PAUSED" : "LIVE"}
              </span>
              <span className="bg-black/60 px-1.5 py-0.5 text-right">
                {detector.backend ?? "—"} · {formatMs(live.latency)} · {live.fps.toFixed(1)} fps
              </span>
            </div>
          )}
          {cam === "on" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between p-2.5 readout text-[0.6875rem] text-white sm:text-xs">
              <span className="bg-black/60 px-1.5 py-0.5">
                {live.detections.length} object{live.detections.length === 1 ? "" : "s"}
              </span>
              <span className="bg-black/60 px-1.5 py-0.5">≥ {settings.threshold.toFixed(2)}</span>
            </div>
          )}

          {modelLoading && (
            <div className="absolute inset-0 grid place-items-center bg-black/35">
              <p className="inline-flex items-center gap-2 bg-black/70 px-3 py-2 readout text-xs text-white" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {detector.status === "error" ? detector.error : `${detector.stage || "Loading detector"}…`}
              </p>
            </div>
          )}

          {cam !== "on" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
              {cam === "error" ? (
                <>
                  <CameraOff className="size-8 opacity-70" aria-hidden />
                  <p className="max-w-sm text-sm opacity-90" role="alert">{error}</p>
                  <Button onClick={() => void start()} variant="primary">Try again</Button>
                </>
              ) : (
                <>
                  <Video className="size-8 opacity-60" aria-hidden />
                  <div>
                    <p className="font-display text-lg font-semibold">Camera is off</p>
                    <p className="mt-1 max-w-sm text-sm opacity-75">
                      Frames are analysed on this device. Nothing is recorded until you press capture.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => void start()} disabled={cam === "starting"}>
                    {cam === "starting" ? <Loader2 className="animate-spin" /> : <Camera />}
                    {cam === "starting" ? "Starting…" : "Start camera"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {cam === "on" ? (
            <Button variant="secondary" onClick={stop} className="col-span-1 sm:w-auto" aria-label="Stop camera">
              <CameraOff /> <span className="hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void start()} disabled={cam === "starting"} aria-label="Start camera">
              <Camera /> <span className="hidden sm:inline">Start</span>
            </Button>
          )}
          <Button variant="secondary" onClick={togglePause} disabled={cam !== "on"} aria-label={paused ? "Resume" : "Pause"} aria-keyshortcuts="Space">
            {paused ? <Play /> : <Pause />} <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </Button>
          <Button variant="secondary" onClick={flip} aria-label="Switch between front and rear camera">
            <SwitchCamera /> <span className="hidden sm:inline">Flip</span>
          </Button>
          <Button onClick={() => void capture()} disabled={cam !== "on" || detector.status !== "ready"} aria-keyshortcuts="C" aria-label="Capture frame to history" className="sm:ml-auto">
            <Aperture /> <span className="hidden sm:inline">Capture</span>
          </Button>
        </div>
        <p className="hidden readout text-xs text-muted-foreground sm:block">
          Space pause · C capture · captures go to history
        </p>

        {!!captures.length && (
          <section aria-label="Captured this session" className="pt-2">
            <p className="eyebrow mb-2">This session</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {captures.map((c) => (
                <li key={c.id} className="motion-safe:animate-lock">
                  <Link href={`/dashboard/history/${c.id}`} className="group block overflow-hidden rounded-sm border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.thumb} alt={`Capture with ${c.detections.filter((d) => d.score >= c.threshold).length} objects`} className="aspect-video w-full object-cover transition-transform group-hover:scale-105" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Side panel */}
      <div className="min-w-0 space-y-4">
        <section aria-labelledby="inframe-title" className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="inframe-title" className="text-sm font-semibold">In frame</h2>
            <span className="readout text-xs text-muted-foreground" aria-live="polite">
              {live.detections.length} / {settings.maxBoxes}
            </span>
          </div>
          <ul className="max-h-64 divide-y divide-border overflow-y-auto">
            {live.detections.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                {cam === "on" ? "Nothing above the threshold yet. Try moving closer or lowering it." : "Start the camera to see live detections."}
              </li>
            )}
            {live.detections.map((d, i) => (
              <li key={`${d.label}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="size-2.5 shrink-0 rounded-[1px]" style={{ background: classColor(d.label) }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm">{d.label}</span>
                <span className="relative block h-1 w-16 overflow-hidden rounded-xs bg-border" aria-hidden>
                  <span className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${d.score * 100}%`, background: classColor(d.label) }} />
                </span>
                <span className="readout w-10 text-right text-xs">{pct(d.score)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Detection controls" className="space-y-4 rounded-md border border-border bg-surface p-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="threshold">Confidence threshold</Label>
              <span className="readout text-sm">{settings.threshold.toFixed(2)}</span>
            </div>
            <Slider
              id="threshold"
              aria-label="Confidence threshold"
              min={0.2}
              max={0.95}
              step={0.05}
              value={[settings.threshold]}
              onValueChange={([v]) => updateSettings({ threshold: v })}
            />
          </div>
          {devices.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="device">Camera</Label>
              <Select
                id="device"
                label="Camera"
                value={deviceId || activeDevice || devices[0].deviceId}
                onValueChange={(id) => {
                  setDeviceId(id);
                  void start({ deviceId: id });
                }}
                options={devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Model, box limit and mirroring live in{" "}
            <Link href="/dashboard/settings" className="underline underline-offset-4 hover:text-foreground">
              Settings
            </Link>
            .
          </p>
        </section>

        <AiPanel
          disabled={cam !== "on"}
          result={ai}
          getImage={async () => frameCanvas()?.toDataURL("image/jpeg", 0.85) ?? null}
          onResult={(r) => {
            setAi(r);
            toast.success("Description ready", {
              description: "Save this frame with its description?",
              action: { label: "Save frame", onClick: () => void capture(r) },
            });
          }}
        />
      </div>
    </div>
  );
}
