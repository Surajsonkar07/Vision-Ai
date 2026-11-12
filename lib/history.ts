"use client";

/**
 * Scan history, stored on the device in IndexedDB.
 * Records (with a small thumbnail) live in one store; full-size images in another,
 * so the history list stays fast even with hundreds of scans.
 */
import { createStore as idbStore, del, entries, get, set, clear, setMany } from "idb-keyval";
import { createStore, useStore } from "./store";
import type { ScanRecord } from "./types";

const scansDb = typeof indexedDB !== "undefined" ? idbStore("visionai-scans", "scans") : undefined;
const imagesDb = typeof indexedDB !== "undefined" ? idbStore("visionai-images", "images") : undefined;

interface HistoryState {
  ready: boolean;
  records: ScanRecord[];
  error: string | null;
}

const initial: HistoryState = { ready: false, records: [], error: null };
export const historyStore = createStore<HistoryState>(initial);

let loadPromise: Promise<void> | null = null;

function sortDesc(list: ScanRecord[]) {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export function loadHistory(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    if (!scansDb) {
      historyStore.set({ ready: true, records: [], error: "IndexedDB is not available in this browser." });
      return;
    }
    try {
      const all = await entries<string, ScanRecord>(scansDb);
      historyStore.set({ ready: true, records: sortDesc(all.map(([, v]) => v)), error: null });
    } catch (err) {
      historyStore.set({
        ready: true,
        records: [],
        error: err instanceof Error ? err.message : "Could not open local history.",
      });
    }
  })();
  return loadPromise;
}

export function useHistory(): HistoryState {
  return useStore(historyStore, initial);
}

export async function saveScan(record: ScanRecord, image?: Blob): Promise<void> {
  historyStore.set((s) => ({ ...s, records: sortDesc([record, ...s.records.filter((r) => r.id !== record.id)]) }));
  if (!scansDb || !imagesDb) return;
  await set(record.id, record, scansDb);
  if (image) await set(record.id, image, imagesDb);
}

export async function updateScan(id: string, patch: Partial<ScanRecord>): Promise<void> {
  const current = historyStore.get().records.find((r) => r.id === id);
  if (!current) return;
  const next = { ...current, ...patch };
  historyStore.set((s) => ({ ...s, records: s.records.map((r) => (r.id === id ? next : r)) }));
  if (scansDb && !next.cloudOnly) await set(id, next, scansDb);
}

export async function deleteScan(id: string): Promise<void> {
  historyStore.set((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
  if (!scansDb || !imagesDb) return;
  await Promise.all([del(id, scansDb), del(id, imagesDb)]);
}

export async function clearHistory(): Promise<void> {
  historyStore.set((s) => ({ ...s, records: s.records.filter((r) => r.cloudOnly) }));
  if (!scansDb || !imagesDb) return;
  await Promise.all([clear(scansDb), clear(imagesDb)]);
}

export async function getScanImage(id: string): Promise<Blob | undefined> {
  if (!imagesDb) return undefined;
  return get<Blob>(id, imagesDb);
}

/** Merge records that exist only in the cloud (another device) into the in-memory list. */
export function mergeCloudRecords(remote: ScanRecord[]) {
  historyStore.set((s) => {
    const local = new Map(s.records.filter((r) => !r.cloudOnly).map((r) => [r.id, r]));
    const extra = remote.filter((r) => !local.has(r.id));
    return { ...s, records: sortDesc([...local.values(), ...extra]) };
  });
}

/** Import records exported as VisionAI JSON. Images are not part of exports, only thumbnails. */
export async function importRecords(records: ScanRecord[]): Promise<number> {
  const valid = records.filter((r) => r && typeof r.id === "string" && Array.isArray(r.detections));
  historyStore.set((s) => {
    const map = new Map(s.records.map((r) => [r.id, r]));
    valid.forEach((r) => map.set(r.id, { ...r, cloudOnly: false }));
    return { ...s, records: sortDesc([...map.values()]) };
  });
  if (scansDb) await setMany(valid.map((r) => [r.id, { ...r, cloudOnly: false }]), scansDb);
  return valid.length;
}

export function visible(record: Pick<ScanRecord, "detections" | "threshold">) {
  return record.detections.filter((d) => d.score >= record.threshold);
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
