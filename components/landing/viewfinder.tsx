import { classColor, LABEL_INK } from "@/lib/colors";

const BOXES = [
  { label: "laptop", score: 0.94, x: 100, y: 178, w: 312, h: 178 },
  { label: "potted plant", score: 0.81, x: 468, y: 150, w: 92, h: 206 },
  { label: "cup", score: 0.88, x: 404, y: 270, w: 66, h: 86 },
  { label: "book", score: 0.67, x: 32, y: 312, w: 96, h: 44 },
];

/** Line-art desk scene with detection overlays. Pure SVG + CSS, so it paints with the HTML. */
export function Viewfinder() {
  return (
    <figure className="dark frame-corners relative overflow-hidden border border-border bg-surface-2 text-foreground">
      <svg viewBox="0 0 600 420" className="block h-auto w-full" role="img" aria-labelledby="vf-title">
        <title id="vf-title">
          A desk scene with a laptop, a potted plant, a cup and a book, each outlined by a labelled detection box.
        </title>
        <defs>
          <pattern id="vf-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="600" height="420" fill="url(#vf-grid)" />

        {/* scene */}
        <g fill="none" stroke="var(--muted-foreground)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.85">
          <path d="M0 356H600" />
          <path d="M0 372H600" strokeDasharray="2 6" opacity="0.5" />
          {/* laptop */}
          <path d="M140 188h232a6 6 0 0 1 6 6v136H134V194a6 6 0 0 1 6-6Z" />
          <path d="M150 200h212v118H150Z" opacity="0.6" />
          <path d="M112 330h288l12 22a3 3 0 0 1-3 4H103a3 3 0 0 1-3-4l12-22Z" />
          <path d="M228 342h56" />
          {/* code lines on screen */}
          <path d="M164 218h70M164 232h120M176 246h84M176 260h104M164 274h48M164 288h96" opacity="0.45" />
          {/* plant */}
          <path d="M484 290h60l-8 66h-44Z" />
          <path d="M480 290h68" />
          <path d="M514 290c-2-34-14-58-34-80M514 290c4-40 18-72 40-96M514 290c0-46-4-86-10-116M514 290c-10-22-26-36-44-40M514 290c10-18 26-30 42-32" />
          {/* cup */}
          <path d="M412 286h46v58a12 12 0 0 1-12 12h-22a12 12 0 0 1-12-12Z" />
          <path d="M458 298h6a10 10 0 0 1 0 20h-6" />
          <path d="M424 270c-4 6 4 8 0 14M438 266c-4 6 4 8 0 14" opacity="0.5" />
          {/* books */}
          <path d="M40 336h84v20H40ZM48 318h72v18H48Z" />
          <path d="M56 324h40M50 344h56" opacity="0.5" />
        </g>

        {/* scan line */}
        <g className="vf-scan">
          <rect x="0" y="0" width="600" height="2" fill="var(--primary)" opacity="0.5" />
        </g>

        {/* detections */}
        {BOXES.map((b, i) => {
          const c = classColor(b.label);
          const text = `${b.label} ${Math.round(b.score * 100)}%`;
          const tw = text.length * 7.2 + 12;
          return (
            <g
              key={b.label}
              className="motion-safe:animate-lock"
              style={{ animationDelay: `${300 + i * 140}ms`, transformOrigin: `${b.x + b.w / 2}px ${b.y + b.h / 2}px` }}
            >
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={classColor(b.label, 0.08)} stroke={c} strokeWidth="1.6" />
              <path
                d={`M${b.x} ${b.y + 12}V${b.y}h12M${b.x + b.w - 12} ${b.y}h12v12M${b.x + b.w} ${b.y + b.h - 12}v12h-12M${b.x + 12} ${b.y + b.h}H${b.x}v-12`}
                fill="none"
                stroke={c}
                strokeWidth="3.2"
              />
              <rect x={b.x - 0.8} y={b.y - 20} width={tw} height="20" fill={c} />
              <text x={b.x + 6} y={b.y - 6} fontSize="12" fill={LABEL_INK} fontFamily="var(--font-plex-mono), monospace" fontWeight="500">
                {text}
              </text>
            </g>
          );
        })}
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 readout text-[0.6875rem] sm:text-xs">
        <span className="inline-flex items-center gap-1.5 bg-background/85 px-1.5 py-0.5">
          <span className="size-1.5 rounded-full bg-accent motion-safe:animate-blink" aria-hidden />
          LIVE
        </span>
        <span className="bg-background/85 px-1.5 py-0.5 text-muted-foreground">webgl · 31 ms · 24 fps</span>
      </div>
      <figcaption className="flex items-center justify-between border-t border-border bg-surface px-3 py-2 readout text-[0.6875rem] text-muted-foreground sm:text-xs">
        <span>4 objects</span>
        <span>threshold 0.50</span>
        <span className="hidden sm:inline">SSDLite MobileNet v2</span>
      </figcaption>
    </figure>
  );
}
