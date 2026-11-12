"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Cloud, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Label, Slider } from "@/components/ui/form-controls";
import { AiPanel } from "@/components/app/ai-panel";
import { EmptyState } from "@/components/app/bits";
import { ExportMenu } from "@/components/app/export-menu";
import { ClassSummary, DetectionTable, Stage } from "@/components/app/stage";
import { deleteCloudScan, syncScan, useSession } from "@/lib/cloud";
import { download, slug } from "@/lib/export";
import { deleteScan, getScanImage, updateScan, useHistory } from "@/lib/history";
import { annotatedPng, blobToDataUrl } from "@/lib/image";
import { useSettings } from "@/lib/settings";
import { formatDate, formatMs } from "@/lib/utils";

export function ScanDetail({ id }: { id: string }) {
  const router = useRouter();
  const { ready, records } = useHistory();
  const { user } = useSession();
  const { showLabels } = useSettings();
  const record = records.find((r) => r.id === id);
  const [image, setImage] = useState<{ id: string; url: string } | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ id: string; value: number } | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    getScanImage(id).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setImage({ id, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true">
        <div className="skeleton aspect-video" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (!record) {
    return (
      <EmptyState
        title="Scan not found"
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/history"><ArrowLeft /> Back to history</Link>
          </Button>
        }
      >
        It may have been deleted, or it was saved in a different browser.
      </EmptyState>
    );
  }

  const threshold = draft?.id === id ? draft.value : record.threshold;
  const shown = record.detections.filter((d) => d.score >= threshold);
  const src = (image?.id === id ? image.url : null) ?? record.remoteUrl ?? record.thumb;
  const view = { ...record, threshold };

  const meta: [string, string][] = [
    ["Captured", formatDate(record.createdAt)],
    ["Source", record.source],
    ["Image", record.width ? `${record.width} × ${record.height}px` : "—"],
    ["Model", record.model],
    ["Backend", record.backend],
    ["Inference", formatMs(record.latencyMs)],
    ["Storage", record.cloudOnly ? "cloud only" : record.syncedAt ? "device + cloud" : "this device"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/history"><ArrowLeft /> History</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {user && !record.syncedAt && !record.cloudOnly && (
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await syncScan(record);
                if (ok) toast.success("Synced to cloud");
                else toast.error("Sync failed");
              }}
            >
              <Cloud /> Sync
            </Button>
          )}
          <ExportMenu
            records={[view]}
            onPng={async () => {
              try {
                const png = await annotatedPng(src, shown, record.width);
                download(png, `${slug(record.name)}-annotated.png`);
                toast.success("Annotated PNG downloaded");
              } catch {
                toast.error("Could not render the image for export");
              }
            }}
          />
          <ConfirmDialog
            title="Delete this scan?"
            description={
              record.syncedAt || record.cloudOnly
                ? "The scan is removed from this device and from your cloud history. This cannot be undone."
                : "The scan and its image are removed from this device. This cannot be undone."
            }
            confirmLabel="Delete scan"
            onConfirm={async () => {
              await deleteScan(record.id);
              if (record.syncedAt || record.cloudOnly) await deleteCloudScan(record.id);
              toast.success("Scan deleted");
              router.push("/dashboard/history");
            }}
            trigger={
              <Button variant="secondary" size="icon" aria-label="Delete scan">
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-3">
          <h1 className="truncate text-2xl font-semibold">{record.name}</h1>
          {src ? (
            <Stage
              src={src}
              width={record.width}
              height={record.height}
              detections={shown}
              showLabels={showLabels}
              highlight={highlight}
              onHighlight={setHighlight}
              alt={`${record.name} with ${shown.length} detected objects`}
            />
          ) : (
            <div className="skeleton aspect-video" />
          )}
          <ClassSummary detections={shown} />
        </div>

        <div className="min-w-0 space-y-4">
          <section className="space-y-3 rounded-md border border-border bg-surface p-4" aria-label="Threshold">
            <div className="flex items-center justify-between">
              <Label htmlFor="d-threshold">Threshold for this scan</Label>
              <span className="readout text-sm">{threshold.toFixed(2)}</span>
            </div>
            <Slider
              id="d-threshold"
              aria-label="Threshold for this scan"
              min={0.2}
              max={0.95}
              step={0.05}
              value={[threshold]}
              onValueChange={([v]) => setDraft({ id, value: v })}
              onValueCommit={([v]) => {
                if (!record.cloudOnly) void updateScan(id, { threshold: v });
              }}
            />
            <p className="readout text-xs text-muted-foreground">
              {shown.length} of {record.detections.length} raw detections shown
            </p>
          </section>
          <DetectionTable detections={shown} highlight={highlight} onHighlight={setHighlight} />
          <dl className="divide-y divide-border rounded-md border border-border bg-surface text-sm">
            {meta.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="readout text-xs text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <AiPanel
            result={record.ai}
            getImage={async () => {
              const blob = await getScanImage(id);
              return blob ? blobToDataUrl(blob) : record.thumb || null;
            }}
            onResult={(r) => void updateScan(id, { ai: r })}
          />
        </div>
      </div>
    </div>
  );
}
