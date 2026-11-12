"use client";

import { Cpu, Loader2, RotateCcw } from "lucide-react";
import { loadDetector, modelLabel, useDetector } from "@/lib/detector";
import { useSettings } from "@/lib/settings";
import { cn, formatMs } from "@/lib/utils";

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        status === "ready" && "bg-primary",
        status === "loading" && "bg-accent motion-safe:animate-blink",
        status === "error" && "bg-destructive",
        status === "idle" && "bg-border-strong",
      )}
    />
  );
}

/** Compact model read-out used in the sidebar and page headers. */
export function ModelStatus({ compact = false }: { compact?: boolean }) {
  const d = useDetector();
  const { model } = useSettings();
  const text =
    d.status === "ready"
      ? `${d.backend} · ready`
      : d.status === "loading"
        ? d.stage || "Loading"
        : d.status === "error"
          ? "Failed to load"
          : "Loads on demand";

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 px-2 readout text-xs text-muted-foreground" role="status" title={text}>
        <StatusDot status={d.status} />
        <span className="hidden max-w-[9rem] truncate min-[420px]:inline">{text}</span>
        <span className="sr-only min-[420px]:hidden">Detector: {text}</span>
      </span>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface-2/60 p-3" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow inline-flex items-center gap-1.5">
          <Cpu className="size-3.5" aria-hidden /> Detector
        </span>
        <StatusDot status={d.status} />
      </div>
      <p className="mt-2 text-sm font-medium">{modelLabel(d.base ?? model)}</p>
      <p className="readout mt-0.5 text-xs text-muted-foreground">
        {text}
        {d.status === "ready" && d.loadMs ? ` · ${formatMs(d.loadMs)}` : ""}
      </p>
      {d.status === "idle" && (
        <button
          type="button"
          onClick={() => void loadDetector(model).catch(() => {})}
          className="mt-2 inline-flex h-9 items-center gap-1.5 text-xs font-medium text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-primary"
        >
          Load now
        </button>
      )}
      {d.status === "loading" && <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" aria-hidden />}
      {d.status === "error" && (
        <button
          type="button"
          onClick={() => void loadDetector(model).catch(() => {})}
          className="mt-2 inline-flex h-9 items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}
