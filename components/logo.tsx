import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <rect width="32" height="32" rx="6" className="fill-foreground" />
      <path
        d="M8 12V8h4M20 8h4v4M24 20v4h-4M12 24H8v-4"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="square"
        className="stroke-primary"
        style={{ stroke: "var(--primary)" }}
      />
      <rect x="12.5" y="12.5" width="7" height="7" className="fill-background" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.0625rem] font-semibold tracking-tight [font-stretch:118%]">
        VisionAI
      </span>
    </span>
  );
}
