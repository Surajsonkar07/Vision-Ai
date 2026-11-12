"use client";

/**
 * Optional Supabase sync. Guests never hit this; signed-in users get each scan
 * mirrored to the `detections` table (+ image in the `detections` storage bucket).
 */
import type { User } from "@supabase/supabase-js";
import { createStore, useStore } from "./store";
import { createClient } from "./supabase/client";
import { getScanImage, mergeCloudRecords, updateScan } from "./history";
import type { Detection, ScanRecord } from "./types";

interface SessionState {
  ready: boolean;
  user: User | null;
}

const initial: SessionState = { ready: false, user: null };
export const sessionStore = createStore<SessionState>(initial);

let started = false;
export function startSession() {
  if (started || typeof window === "undefined") return;
  started = true;
  void (async () => {
    const supabase = await createClient();
    if (!supabase) {
      sessionStore.set({ ready: true, user: null });
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => sessionStore.set({ ready: true, user: data.user ?? null }))
      .catch(() => sessionStore.set({ ready: true, user: null }));
    supabase.auth.onAuthStateChange((_event, session) => {
      sessionStore.set({ ready: true, user: session?.user ?? null });
    });
  })();
}

export function useSession(): SessionState {
  return useStore(sessionStore, initial);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  sessionStore.set({ ready: true, user: null });
}

interface DetectionRow {
  id: string;
  created_at: string;
  file_path: string;
  file_type: string;
  objects_detected: unknown;
  accuracy: number;
  latency: number;
  metadata: Record<string, unknown> | null;
}

/** Push one scan. Returns true when stored remotely. */
export async function syncScan(record: ScanRecord): Promise<boolean> {
  const supabase = await createClient();
  const user = sessionStore.get().user;
  if (!supabase || !user || record.cloudOnly) return false;

  let filePath = record.source === "camera" ? "webcam_capture" : `scans/${user.id}/${record.id}.jpg`;
  const image = await getScanImage(record.id);
  if (image) {
    filePath = `scans/${user.id}/${record.id}.jpg`;
    const { error } = await supabase.storage
      .from("detections")
      .upload(filePath, image, { upsert: true, contentType: image.type || "image/jpeg" });
    if (error) filePath = record.source === "camera" ? "webcam_capture" : "local_only";
  }

  const kept = record.detections.filter((d) => d.score >= record.threshold);
  const accuracy = kept.length ? kept.reduce((a, d) => a + d.score, 0) / kept.length : 0;
  const { error } = await supabase.from("detections").upsert({
    id: record.id,
    user_id: user.id,
    created_at: new Date(record.createdAt).toISOString(),
    file_path: filePath,
    file_type: record.source === "video" ? "video" : "image",
    objects_detected: kept,
    accuracy,
    latency: record.latencyMs / 1000,
    metadata: {
      source: record.source,
      name: record.name,
      width: record.width,
      height: record.height,
      model: record.model,
      backend: record.backend,
      threshold: record.threshold,
      all_detections: record.detections,
      ai: record.ai ?? null,
    },
  });
  if (error) return false;
  await updateScan(record.id, { syncedAt: Date.now() });
  return true;
}

/** Push every unsynced local scan. */
export async function syncAll(records: ScanRecord[]): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (const r of records.filter((x) => !x.syncedAt && !x.cloudOnly)) {
    if (await syncScan(r)) ok++;
    else failed++;
  }
  return { ok, failed };
}

function isDetectionArray(v: unknown): v is Detection[] {
  return Array.isArray(v) && v.every((d) => d && typeof d === "object" && "label" in d && "bbox" in d);
}

/** Pull rows from the cloud that this device does not have yet. */
export async function pullCloud(): Promise<number> {
  const supabase = await createClient();
  const user = sessionStore.get().user;
  if (!supabase || !user) return 0;
  const { data, error } = await supabase
    .from("detections")
    .select("id, created_at, file_path, file_type, objects_detected, accuracy, latency, metadata")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return 0;

  const records: ScanRecord[] = (data as DetectionRow[]).map((row) => {
    const meta = row.metadata ?? {};
    const all = isDetectionArray(meta.all_detections)
      ? meta.all_detections
      : isDetectionArray(row.objects_detected)
        ? row.objects_detected
        : [];
    const hasFile = row.file_path && !["webcam_capture", "local_only"].includes(row.file_path);
    const remoteUrl = hasFile
      ? supabase.storage.from("detections").getPublicUrl(row.file_path).data.publicUrl
      : undefined;
    // Legacy rows (from the old LLM-only version) store `{ object }` instead of boxes.
    const legacy =
      !all.length && row.objects_detected && typeof row.objects_detected === "object"
        ? (row.objects_detected as { object?: string; label?: string } | { label?: string }[])
        : null;
    const legacyLabel = Array.isArray(legacy) ? legacy[0]?.label : legacy?.object ?? legacy?.label;
    return {
      id: row.id,
      createdAt: new Date(row.created_at).getTime(),
      source: (meta.source as ScanRecord["source"]) ?? (row.file_type === "video" ? "video" : "upload"),
      name: (meta.name as string) ?? legacyLabel ?? row.file_path.split("/").pop() ?? "cloud scan",
      width: Number(meta.width) || 0,
      height: Number(meta.height) || 0,
      thumb: remoteUrl ?? "",
      detections: all,
      threshold: Number(meta.threshold) || 0,
      latencyMs: (row.latency || 0) * 1000,
      model: (meta.model as string) ?? (legacyLabel ? "LLM (legacy)" : "unknown"),
      backend: (meta.backend as string) ?? "cloud",
      ai: (meta.ai as ScanRecord["ai"]) ?? undefined,
      syncedAt: new Date(row.created_at).getTime(),
      remoteUrl,
      cloudOnly: true,
    };
  });
  mergeCloudRecords(records);
  return records.length;
}

export async function deleteCloudScan(id: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase || !sessionStore.get().user) return;
  await supabase.from("detections").delete().eq("id", id);
}
