export type BBox = [x: number, y: number, w: number, h: number];

export interface Detection {
  label: string;
  score: number;
  bbox: BBox;
}

export type ScanSource = "upload" | "camera" | "video";

export interface AiAnalysis {
  object: string;
  explanation: string;
  translation?: { object: string; explanation: string };
  detected_lang?: string;
  deep_info?: string;
  examples?: string[];
  used_model?: string;
  language: string;
  deep: boolean;
}

export interface ScanRecord {
  id: string;
  createdAt: number;
  source: ScanSource;
  name: string;
  width: number;
  height: number;
  /** Small JPEG data URL for lists (max 320px). */
  thumb: string;
  /** All detections above the detector floor; views filter by `threshold`. */
  detections: Detection[];
  threshold: number;
  latencyMs: number;
  model: string;
  backend: string;
  ai?: AiAnalysis;
  /** Set when the record exists in the signed-in user's Supabase table. */
  syncedAt?: number;
  /** Public URL of the image when stored in Supabase Storage (cloud-only records). */
  remoteUrl?: string;
  cloudOnly?: boolean;
}

export type ModelBase = "lite_mobilenet_v2" | "mobilenet_v2";
