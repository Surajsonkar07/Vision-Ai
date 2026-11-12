import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VisionAI — on-device object detection",
    short_name: "VisionAI",
    description: "Detect objects in photos, video and the live camera, on your device.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1114",
    theme_color: "#0f1114",
    categories: ["utilities", "photo", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Live scan", url: "/dashboard/webcam", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Analyse a photo", url: "/dashboard/upload", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "History", url: "/dashboard/history", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
