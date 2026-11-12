"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Cloud, CloudUpload, Film, ImageUp, Loader2, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form-controls";
import { EmptyState } from "@/components/app/bits";
import { ExportMenu } from "@/components/app/export-menu";
import { classColor } from "@/lib/colors";
import { clearHistory, importRecords, useHistory, visible } from "@/lib/history";
import { syncAll, useSession } from "@/lib/cloud";
import type { ScanRecord, ScanSource } from "@/lib/types";
import { formatDate, formatMs } from "@/lib/utils";

const SOURCE_ICON: Record<ScanSource, typeof Camera> = { camera: Camera, upload: ImageUp, video: Film };

function topLabels(r: ScanRecord) {
  const counts = new Map<string, number>();
  visible(r).forEach((d) => counts.set(d.label, (counts.get(d.label) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function HistoryList() {
  const { ready, records, error } = useHistory();
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"all" | ScanSource>("all");
  const [sort, setSort] = useState<"new" | "old" | "most">("new");
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = records.filter((r) => source === "all" || r.source === source);
    if (term) {
      list = list.filter(
        (r) => r.name.toLowerCase().includes(term) || visible(r).some((d) => d.label.includes(term)),
      );
    }
    if (sort === "old") list = [...list].sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "most") list = [...list].sort((a, b) => visible(b).length - visible(a).length);
    return list;
  }, [records, q, source, sort]);

  const unsynced = records.filter((r) => !r.syncedAt && !r.cloudOnly).length;
  const localCount = records.filter((r) => !r.cloudOnly).length;

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading history">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/3]" />
        ))}
      </div>
    );
  }

  const importInput = (
    <input
      ref={fileRef}
      type="file"
      accept="application/json,.json"
      className="sr-only"
      aria-label="Import VisionAI JSON"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        try {
          const data = JSON.parse(await f.text());
          const n = await importRecords(Array.isArray(data) ? data : data.scans ?? []);
          toast.success(`Imported ${n} scan${n === 1 ? "" : "s"}`);
        } catch {
          toast.error("That file is not a VisionAI export");
        }
      }}
    />
  );

  if (!records.length) {
    return (
      <>
        {importInput}
        <EmptyState
          title="No scans yet"
          action={
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild>
                <Link href="/dashboard/webcam"><Camera /> Live scan</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/upload"><ImageUp /> Upload a photo</Link>
              </Button>
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                <Upload /> Import JSON
              </Button>
            </div>
          }
        >
          {error ?? "Captured frames and analysed photos appear here, stored in this browser. Nothing is uploaded unless you sign in to sync."}
        </EmptyState>
      </>
    );
  }

  return (
    <div className="space-y-5">
      {importInput}
      {/* Toolbar */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_11rem_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by label or file name — e.g. dog"
            aria-label="Search scans"
            className="pl-9"
          />
        </div>
        <Select
          label="Source"
          value={source}
          onValueChange={(v) => setSource(v as typeof source)}
          options={[
            { value: "all", label: "All sources" },
            { value: "camera", label: "Camera" },
            { value: "upload", label: "Uploads" },
            { value: "video", label: "Video frames" },
          ]}
        />
        <Select
          label="Sort"
          value={sort}
          onValueChange={(v) => setSort(v as typeof sort)}
          options={[
            { value: "new", label: "Newest first" },
            { value: "old", label: "Oldest first" },
            { value: "most", label: "Most objects" },
          ]}
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <ExportMenu records={filtered} variant="primary" />
          <Button variant="secondary" size="icon" aria-label="Import VisionAI JSON" title="Import JSON" onClick={() => fileRef.current?.click()}>
            <Upload />
          </Button>
          <ConfirmDialog
            title="Clear local history?"
            description={`This permanently deletes ${localCount} scan${localCount === 1 ? "" : "s"} and their images from this browser. Export first if you want a copy. Cloud copies are not affected.`}
            confirmLabel="Delete all"
            onConfirm={async () => {
              await clearHistory();
              toast.success("Local history cleared");
            }}
            trigger={
              <Button variant="secondary" size="icon" aria-label="Clear local history" title="Clear history">
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="readout text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} of {records.length} scans
        </p>
        {user && unsynced > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              const { ok, failed } = await syncAll(records);
              setSyncing(false);
              if (failed) toast.error(`${failed} scan${failed === 1 ? "" : "s"} failed to sync`, { description: `${ok} synced` });
              else toast.success(`${ok} scan${ok === 1 ? "" : "s"} synced`);
            }}
          >
            {syncing ? <Loader2 className="animate-spin" /> : <CloudUpload />} Sync {unsynced} to cloud
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No scans match">Try another label, or reset the source filter.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => {
              const Icon = SOURCE_ICON[r.source] ?? ImageUp;
              const labels = topLabels(r);
              const n = visible(r).length;
              return (
                <motion.li
                  key={r.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.03 } }}
                  exit={{ opacity: 0 }}
                >
                  <Link
                    href={`/dashboard/history/${r.id}`}
                    className="group block overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-border-strong"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                      {r.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumb} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid size-full place-items-center readout text-xs text-muted-foreground">no image</div>
                      )}
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-black/65 px-1.5 py-0.5 readout text-[0.6875rem] text-white">
                        <Icon className="size-3" aria-hidden /> {r.source}
                      </span>
                      {(r.syncedAt || r.cloudOnly) && (
                        <span className="absolute right-2 top-2 bg-black/65 p-1 text-white" title={r.cloudOnly ? "Stored in cloud" : "Synced"}>
                          <Cloud className="size-3" aria-label={r.cloudOnly ? "Stored in cloud" : "Synced"} />
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium">{r.name}</p>
                        <p className="readout shrink-0 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {labels.slice(0, 4).map(([l, c]) => (
                          <span key={l} className="inline-flex items-center gap-1 rounded-xs bg-surface-2 px-1.5 py-0.5 text-xs">
                            <span className="size-1.5 rounded-[1px]" style={{ background: classColor(l) }} aria-hidden />
                            {l}
                            {c > 1 && <span className="readout text-muted-foreground">×{c}</span>}
                          </span>
                        ))}
                        {labels.length > 4 && <span className="readout px-1 text-xs text-muted-foreground">+{labels.length - 4}</span>}
                        {!labels.length && <span className="text-xs text-muted-foreground">No objects above {r.threshold.toFixed(2)}</span>}
                      </div>
                      <p className="readout text-xs text-muted-foreground">
                        {n} obj · {formatMs(r.latencyMs)} · {r.backend}
                      </p>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
