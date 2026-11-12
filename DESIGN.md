# VisionAI — design system

**Identity: "calibration bench".** VisionAI is a measuring instrument for images.
The UI borrows from lab equipment and camera viewfinders: hairline rules,
corner brackets, monospaced read-outs, tabular numbers and one high-visibility
signal colour. Nothing glows, nothing floats. Data is the decoration.

## Colour (OKLCH, tokens in `app/globals.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `0.985 0.004 95` paper | `0.155 0.008 255` graphite | page |
| `--surface` | `1 0 0` | `0.195 0.009 255` | panels |
| `--surface-2` | `0.962 0.005 95` | `0.235 0.01 255` | wells, inputs, table heads |
| `--foreground` | `0.2 0.012 255` | `0.955 0.006 95` | text |
| `--muted-foreground` | `0.46 0.012 255` | `0.72 0.01 255` | secondary text (AA on bg + surface) |
| `--border` | `0.895 0.006 255` | `0.305 0.01 255` | hairlines |
| `--primary` "reticle" | `0.5 0.135 138` | `0.885 0.19 124` | actions, focus, live boxes |
| `--primary-foreground` | white | `0.2 0.04 130` | text on primary |
| `--accent` "infrared" | `0.58 0.19 33` | `0.73 0.16 38` | LIVE / REC, highlights |
| `--destructive` | `0.55 0.2 25` | `0.68 0.19 25` | delete, errors |

Dark mode is tuned separately: the reticle green becomes a bright lime with
dark text (instrument display), light mode uses a deep field green with white text.

Bounding-box colours come from a fixed 10-hue ramp (`lib/colors.ts`) at a
constant lightness, hashed from the class name, so a class keeps its colour
across scans, exports and themes. Boxes always sit on photos, so they do not change with the theme.

## Type

- Display: **Archivo** expanded (`wdth 112–125`), 600–700, tight tracking. Headlines and big numbers.
- UI: **IBM Plex Sans** 400/500/600.
- Data: **IBM Plex Mono** 400/500 for labels, read-outs, coordinates, tables; `tabular-nums` everywhere numbers line up.
- Scale (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4.25. Body 1rem/1.6. Minimum 12px.
- Eyebrows: mono, 12px, uppercase, `letter-spacing: .08em`, prefixed with an index (`01 —`).

## Shape and spacing

- 4px base grid; section rhythm 96/128px desktop, 64px mobile.
- Radius: 4px (controls) / 6px (panels) / 2px (chips). No pills except status dots.
- Borders over shadows. One shadow token (`--shadow-pop`) for menus and dialogs only.
- Signature motif: viewfinder corner brackets (`.frame-corners`) on media frames.

## Motion

- 150–250 ms, `cubic-bezier(.2,.8,.2,1)` (ease-out). Boxes "lock on": scale 1.04 → 1 with opacity.
- Route change: 180 ms fade + 6px rise. Lists stagger 30 ms per item, max 8.
- Scroll reveals are progressive: content is visible in server HTML; only below-fold blocks animate after hydration.
- `prefers-reduced-motion`: all transitions and reveals off; live overlay still updates (it is data, not decoration).

## Layout

- Landing: editorial split hero with a line-art viewfinder, pipeline timeline,
  spec-sheet table, bento of workflows, dense class index.
- Console: 240px sidebar ≥1024px; below that a top bar plus bottom tab bar (44px+ targets).
- Tables collapse to stacked rows below 640px.
