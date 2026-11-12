"use client";

import { DropdownMenu } from "radix-ui";
import { ChevronDown, Download, FileImage, FileJson, FileSpreadsheet, Boxes } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportCoco, exportCsv, exportJson } from "@/lib/export";
import type { ScanRecord } from "@/lib/types";

export function ExportMenu({
  records,
  onPng,
  label = "Export",
  variant = "secondary",
}: {
  records: ScanRecord[];
  onPng?: () => void;
  label?: string;
  variant?: "secondary" | "primary";
}) {
  const disabled = !records.length;
  const done = (what: string) => toast.success(`${what} downloaded`, { description: `${records.length} scan${records.length === 1 ? "" : "s"}` });
  const item =
    "flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xs px-3 text-sm outline-none data-[highlighted]:bg-surface-2";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant={variant} disabled={disabled}>
          <Download /> {label} <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-md border border-border bg-surface p-1 text-foreground shadow-pop data-[state=open]:animate-rise"
        >
          {onPng && (
            <DropdownMenu.Item className={item} onSelect={onPng}>
              <FileImage className="size-4 text-muted-foreground" />
              <span className="flex-1">Annotated PNG</span>
              <span className="readout text-xs text-muted-foreground">.png</span>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className={item} onSelect={() => (exportCsv(records), done("CSV"))}>
            <FileSpreadsheet className="size-4 text-muted-foreground" />
            <span className="flex-1">Detections table</span>
            <span className="readout text-xs text-muted-foreground">.csv</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => (exportCoco(records), done("COCO annotations"))}>
            <Boxes className="size-4 text-muted-foreground" />
            <span className="flex-1">COCO annotations</span>
            <span className="readout text-xs text-muted-foreground">.json</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => (exportJson(records), done("VisionAI JSON"))}>
            <FileJson className="size-4 text-muted-foreground" />
            <span className="flex-1">Full records</span>
            <span className="readout text-xs text-muted-foreground">.json</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
