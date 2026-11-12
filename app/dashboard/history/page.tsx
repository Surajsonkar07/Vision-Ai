import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { MotionRoot } from "@/components/app/motion-root";
import { HistoryList } from "./history-list";

export const metadata: Metadata = {
  title: "History",
  description: "Every scan you have saved, with export to CSV, COCO and JSON.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="History"
        title="Scans on this device."
        description="Search by what was detected, open a scan to re-tune its threshold, and export results for spreadsheets or training data."
      />
      <MotionRoot>
        <HistoryList />
      </MotionRoot>
    </div>
  );
}
