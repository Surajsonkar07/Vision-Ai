import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main id="main" className="hairline-grid grid min-h-dvh place-items-center px-4">
      <div className="frame-corners w-full max-w-md border border-border bg-surface p-8">
        <Logo />
        <div className="mt-8 flex items-center gap-3 text-accent">
          <WifiOff className="size-5" aria-hidden />
          <p className="eyebrow !text-accent">No connection</p>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">You&apos;re offline.</h1>
        <p className="mt-3 text-muted-foreground">
          Pages you have opened before still work, and once the detection model has downloaded, live scans
          and photo analysis run without a network. Your history is stored on this device.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/webcam"
            className="inline-flex h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Open live scan
          </Link>
          <Link
            href="/dashboard/history"
            className="inline-flex h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-medium"
          >
            View history
          </Link>
        </div>
      </div>
    </main>
  );
}
