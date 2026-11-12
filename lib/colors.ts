/**
 * Fixed class-colour ramp. Constant lightness so every label tab can use dark text.
 * Boxes are drawn over photos, so these do not change with the UI theme.
 */
const HUES = [124, 200, 38, 280, 160, 330, 60, 240, 12, 95];

export function hashLabel(label: string): number {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function classHue(label: string): number {
  return HUES[hashLabel(label) % HUES.length];
}

export function classColor(label: string, alpha = 1): string {
  const h = classHue(label);
  return alpha === 1 ? `oklch(0.84 0.17 ${h})` : `oklch(0.84 0.17 ${h} / ${alpha})`;
}

export const LABEL_INK = "oklch(0.18 0.02 255)";
