import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { Uploader } from "./uploader";

export const metadata: Metadata = {
  title: "Upload",
  description: "Detect objects in photos and video files without uploading them anywhere.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Upload"
        title="Analyse photos and video."
        description="Images are analysed one after another and saved to history. Videos are analysed frame by frame while they play."
      />
      <Uploader />
    </div>
  );
}
