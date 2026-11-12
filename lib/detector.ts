"use client";

/**
 * In-browser object detector (TensorFlow.js + COCO-SSD).
 * Everything heavy is dynamically imported, so nothing here touches first paint:
 * the libraries and weights load only when a page asks for the model.
 */
import type { ObjectDetection } from "@tensorflow-models/coco-ssd";
import { createStore, useStore } from "./store";
import type { Detection, ModelBase } from "./types";

export type DetectorStatus = "idle" | "loading" | "ready" | "error";

export interface DetectorState {
  status: DetectorStatus;
  base: ModelBase | null;
  backend: string | null;
  loadMs: number | null;
  stage: string;
  error: string | null;
}

const initial: DetectorState = {
  status: "idle",
  base: null,
  backend: null,
  loadMs: null,
  stage: "",
  error: null,
};

export const detectorStore = createStore<DetectorState>(initial);

let model: ObjectDetection | null = null;
let loading: Promise<ObjectDetection> | null = null;
let loadingBase: ModelBase | null = null;

/** Minimum score kept from the network; UI thresholds filter above this. */
export const DETECTOR_FLOOR = 0.2;

async function setupBackend(): Promise<string> {
  const tf = await import("@tensorflow/tfjs-core");
  await import("@tensorflow/tfjs-backend-cpu");
  try {
    await import("@tensorflow/tfjs-backend-webgl");
    if (await tf.setBackend("webgl")) {
      await tf.ready();
      return tf.getBackend();
    }
  } catch {
    /* fall through to CPU */
  }
  await tf.setBackend("cpu");
  await tf.ready();
  return tf.getBackend();
}

export function loadDetector(base: ModelBase): Promise<ObjectDetection> {
  if (model && detectorStore.get().base === base) return Promise.resolve(model);
  if (loading && loadingBase === base) return loading;

  const started = performance.now();
  loadingBase = base;
  detectorStore.set((s) => ({ ...s, status: "loading", stage: "Starting runtime", error: null }));

  const run = (async () => {
    const backend = await setupBackend();
    detectorStore.set((s) => ({ ...s, backend, stage: "Fetching weights" }));
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    if (model) {
      model.dispose();
      model = null;
    }
    const m = await cocoSsd.load({ base });
    detectorStore.set((s) => ({ ...s, stage: "Warming up" }));
    // First inference compiles shaders; do it on a blank frame so the user's first scan is fast.
    const warm = document.createElement("canvas");
    warm.width = 64;
    warm.height = 64;
    await m.detect(warm, 1, 0.99);
    model = m;
    detectorStore.set({
      status: "ready",
      base,
      backend,
      loadMs: performance.now() - started,
      stage: "",
      error: null,
    });
    return m;
  })();

  loading = run;
  run.catch((err: unknown) => {
    loading = null;
    loadingBase = null;
    const message =
      err instanceof Error
        ? err.message.includes("fetch")
          ? "Could not download the model. Check your connection and try again."
          : err.message
        : "The model failed to load.";
    detectorStore.set((s) => ({ ...s, status: "error", stage: "", error: message }));
  });
  return run;
}

export type DetectInput = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData;

export async function detect(
  input: DetectInput,
  base: ModelBase,
  maxBoxes = 20,
): Promise<{ detections: Detection[]; latencyMs: number }> {
  const m = await loadDetector(base);
  const t0 = performance.now();
  const raw = await m.detect(input, maxBoxes, DETECTOR_FLOOR);
  const latencyMs = performance.now() - t0;
  return {
    latencyMs,
    detections: raw.map((r) => ({
      label: r.class,
      score: r.score,
      bbox: r.bbox.map((v) => Math.round(v * 10) / 10) as Detection["bbox"],
    })),
  };
}

export function useDetector(): DetectorState {
  return useStore(detectorStore, initial);
}

/** Load once the browser is idle, so the model never competes with first paint. */
export function scheduleLoad(base: ModelBase): () => void {
  if (typeof window === "undefined") return () => {};
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(() => void loadDetector(base).catch(() => {}), { timeout: 1500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const t = window.setTimeout(() => void loadDetector(base).catch(() => {}), 300);
  return () => window.clearTimeout(t);
}

export function modelLabel(base: ModelBase | null): string {
  if (base === "mobilenet_v2") return "SSD MobileNet v2";
  if (base === "lite_mobilenet_v2") return "SSDLite MobileNet v2";
  return "—";
}
