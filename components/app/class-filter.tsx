"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/form-controls";
import { COCO_GROUPS } from "@/lib/coco";
import { classColor } from "@/lib/colors";
import { settingsStore, updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/** Settings control: choose which COCO classes are shown during detection. */
export function ClassFilterPicker() {
  const { classFilter } = useSettings();
  const [q, setQ] = useState("");
  const selected = useMemo(() => new Set(classFilter), [classFilter]);
  const term = q.trim().toLowerCase();

  // Read the latest store value so quick successive clicks never drop a selection.
  const toggle = (name: string) => {
    const next = new Set(settingsStore.get().classFilter);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    updateSettings({ classFilter: [...next] });
  };

  const groups = COCO_GROUPS.map((g) => ({ ...g, classes: g.classes.filter((c) => !term || c.includes(term)) })).filter(
    (g) => g.classes.length,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a class — e.g. person" aria-label="Find a class" className="pl-9" />
        </div>
        <button
          type="button"
          onClick={() => updateSettings({ classFilter: [] })}
          aria-pressed={!classFilter.length}
          className={cn(
            "h-11 rounded-sm border px-3 text-sm transition-colors",
            classFilter.length ? "border-border-strong hover:bg-surface-2" : "border-foreground bg-foreground text-background",
          )}
        >
          All classes
        </button>
      </div>
      <p className="readout text-xs text-muted-foreground" aria-live="polite">
        {classFilter.length ? `${classFilter.length} of 80 classes shown` : "All 80 classes shown"}
      </p>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {groups.map((g) => (
          <fieldset key={g.group}>
            <legend className="eyebrow mb-1.5">{g.group}</legend>
            <div className="flex flex-wrap gap-1.5">
              {g.classes.map((c) => {
                const on = selected.has(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(c)}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-xs border px-2.5 text-sm transition-colors",
                      on ? "border-primary bg-primary-soft text-foreground" : "border-border hover:border-border-strong",
                    )}
                  >
                    <span className="size-2 rounded-[1px]" style={{ background: classColor(c) }} aria-hidden />
                    {c}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        {!groups.length && <p className="text-sm text-muted-foreground">No class matches “{q}”.</p>}
      </div>
    </div>
  );
}

/** Small badge on detection pages when a class filter is active. */
export function ClassFilterBadge() {
  const { classFilter } = useSettings();
  if (!classFilter.length) return null;
  const label = classFilter.length <= 2 ? classFilter.join(", ") : `${classFilter.length} classes`;
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-sm border border-primary/50 bg-primary-soft py-1 pl-2.5 pr-1 text-sm" role="status">
      <Filter className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        Showing only{" "}
        <Link href="/dashboard/settings#class-filter" className="font-medium underline underline-offset-4">
          {label}
        </Link>
      </span>
      <button
        type="button"
        onClick={() => updateSettings({ classFilter: [] })}
        aria-label="Show all classes"
        className="grid size-8 shrink-0 place-items-center rounded-xs hover:bg-background/60"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
