// Generates PWA icons from the monogram. Run: npm run icons (uses sharp, bundled with Next).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const mark = (pad) => {
  const s = 512;
  const inner = s - pad * 2;
  const k = inner / 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" ${pad ? "" : `rx="${6 * k}"`} fill="#15181d"/>
  <g transform="translate(${pad} ${pad}) scale(${k})">
    <path d="M8 12V8h4M20 8h4v4M24 20v4h-4M12 24H8v-4" fill="none" stroke="#c6f24e" stroke-width="2.25" stroke-linecap="square"/>
    <rect x="12.5" y="12.5" width="7" height="7" fill="#f4f2ec"/>
  </g>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
const any = Buffer.from(mark(0));
const maskable = Buffer.from(mark(96));
await sharp(any).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(any).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(maskable).resize(512, 512).png().toFile("public/icons/maskable-512.png");
// Apple ignores transparency: use the full-bleed variant.
await sharp(maskable).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
console.log("icons written to public/icons");
