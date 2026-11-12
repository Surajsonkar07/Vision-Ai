import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { AnalyticsView } from "./analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="What your scans contain."
        description="Computed locally from your history — activity, class frequency, confidence spread and inference speed."
      />
      <AnalyticsView />
    </div>
  );
}
