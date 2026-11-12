import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { LiveScanner } from "./live-scanner";

export const metadata: Metadata = {
  title: "Live scan",
  description: "Real-time object detection from your laptop or phone camera, computed on the device.",
};

export default function WebcamPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Live scan"
        title="Point the camera at something."
        description="Boxes update every frame. Capture a moment to keep it in history with its detections."
      />
      <LiveScanner />
    </div>
  );
}
