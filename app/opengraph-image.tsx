import { ImageResponse } from "next/og";

export const alt = "VisionAI — on-device object detection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BOXES = [
  { x: 640, y: 170, w: 300, h: 230, label: "laptop 94%", c: "#c6f24e" },
  { x: 960, y: 120, w: 150, h: 300, label: "potted plant 81%", c: "#7fd8f0" },
  { x: 880, y: 330, w: 90, h: 120, label: "cup 88%", c: "#f2b36b" },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#14171b",
          color: "#f4f2ec",
          padding: 72,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700 }}>
            <div style={{ width: 48, height: 48, border: "4px solid #c6f24e", display: "flex" }} />
            VisionAI
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>See what&apos;s in the frame.</div>
            <div style={{ fontSize: 28, color: "#a7adb7", marginTop: 24 }}>
              Object detection in your browser · 80 classes · no upload
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#a7adb7", fontFamily: "monospace" }}>COCO-SSD · TensorFlow.js</div>
        </div>
        {BOXES.map((b) => (
          <div
            key={b.label}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              border: `3px solid ${b.c}`,
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -34,
                left: -3,
                background: b.c,
                color: "#14171b",
                fontSize: 20,
                padding: "4px 10px",
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              {b.label}
            </div>
          </div>
        ))}
      </div>
    ),
    size,
  );
}
