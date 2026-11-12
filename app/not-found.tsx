import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main id="main" className="hairline-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-lg">
        <Link href="/" aria-label="VisionAI home">
          <Logo />
        </Link>
        <div className="frame-corners relative mt-10 aspect-[16/9] border border-dashed border-border-strong bg-surface">
          <div className="absolute inset-0 grid place-items-center">
            <p className="readout text-sm text-muted-foreground">0 objects · score &lt; threshold</p>
          </div>
          <span className="readout absolute left-3 top-3 bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
            404
          </span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold">Nothing detected at this address.</h1>
        <p className="mt-3 text-muted-foreground">The page may have moved, or the link is mistyped.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground">
            Open the console
          </Link>
          <Link href="/" className="inline-flex h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-medium">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
