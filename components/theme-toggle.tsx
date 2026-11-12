"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Match system theme", Icon: Monitor },
] as const;

/** Compact cycle button: light → dark → system. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const next = OPTIONS[(OPTIONS.indexOf(current) + 1) % OPTIONS.length];
  const Icon = hydrated ? current.Icon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={hydrated ? `${current.label}. Switch to ${next.label.toLowerCase()}` : "Change theme"}
      title={hydrated ? current.label : "Theme"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-[1.125rem]" />
    </button>
  );
}

/** Segmented control for the settings page. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-grid grid-cols-3 rounded-sm border border-border-strong p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = hydrated && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-xs px-3 text-sm transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="capitalize">{value}</span>
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
