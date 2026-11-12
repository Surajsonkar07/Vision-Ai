"use client";

import { createStore, useStore } from "./store";
import type { ModelBase } from "./types";

export interface Settings {
  model: ModelBase;
  threshold: number;
  maxBoxes: number;
  showLabels: boolean;
  mirrorFront: boolean;
  autoSaveUploads: boolean;
  aiLanguage: string;
  /** COCO class names to show; empty = all classes. */
  classFilter: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  model: "lite_mobilenet_v2",
  threshold: 0.5,
  maxBoxes: 20,
  showLabels: true,
  mirrorFront: true,
  autoSaveUploads: true,
  aiLanguage: "English",
  classFilter: [],
};

const KEY = "visionai.settings.v1";

function read(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const settingsStore = createStore<Settings>(read());

if (typeof window !== "undefined") {
  settingsStore.subscribe(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(settingsStore.get()));
    } catch {
      /* storage full or blocked */
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) settingsStore.set(read());
  });
}

export function useSettings(): Settings {
  return useStore(settingsStore, DEFAULT_SETTINGS);
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((s) => ({ ...s, ...patch }));
}

export const MODEL_INFO: Record<ModelBase, { name: string; short: string; size: string; note: string }> = {
  lite_mobilenet_v2: {
    name: "SSDLite MobileNet v2",
    short: "Lite",
    size: "small download",
    note: "Fastest. Best for phones and live camera.",
  },
  mobilenet_v2: {
    name: "SSD MobileNet v2",
    short: "Full",
    size: "large download",
    note: "More accurate on small objects. Slower first load.",
  },
};

/** Keep detections at or above the threshold and, when a class filter is set, only those classes. */
export function visibleFor<T extends { label: string; score: number }>(
  detections: T[],
  threshold: number,
  classFilter: string[] = [],
): T[] {
  if (!classFilter.length) return detections.filter((d) => d.score >= threshold);
  const allow = new Set(classFilter);
  return detections.filter((d) => d.score >= threshold && allow.has(d.label));
}
