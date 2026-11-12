import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Settings" title="Tune the instrument." description="Preferences are saved in this browser." />
      <SettingsView />
    </div>
  );
}
