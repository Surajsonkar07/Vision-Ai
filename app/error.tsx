"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-4">
      <div className="frame-corners w-full max-w-md border border-border bg-surface p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" aria-hidden />
          <p className="eyebrow !text-destructive">Runtime error</p>
        </div>
        <h1 className="mt-3 text-xl font-semibold">This view stopped working.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your scans are safe — they are stored on this device. Try again, or reload the page.
        </p>
        {error.digest && <p className="readout mt-3 text-xs text-muted-foreground">ref {error.digest}</p>}
        <Button className="mt-5" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </main>
  );
}
