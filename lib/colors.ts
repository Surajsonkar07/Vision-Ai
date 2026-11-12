import { COCO_ID_BY_NAME } from "./coco";

/**
 * Class colours: golden-angle hues keyed by COCO category id, so neighbouring classes never share
 * a colour and a class keeps its colour everywhere. Constant lightness lets every label tab use
 * dark text. Boxes sit on photos, so these do not change with the UI theme.
 */
export function hashLabel(label: string): number {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function classHue(label: string): number {
  const id = COCO_ID_BY_NAME[label] ?? hashLabel(label) % 97;
  return Math.round((id * 137.508 + 120) % 360);
}

export function classColor(label: string, alpha = 1): string {
  const h = classHue(label);
  return alpha === 1 ? `oklch(0.83 0.16 ${h})` : `oklch(0.83 0.16 ${h} / ${alpha})`;
}

export const LABEL_INK = "oklch(0.18 0.02 255)";
