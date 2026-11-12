import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthToaster } from "./auth-toaster";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_minmax(0,32rem)]">
      <aside className="hairline-grid relative hidden flex-col justify-between border-r border-border bg-surface-2 p-10 lg:flex">
        <Link href="/" aria-label="VisionAI home">
          <Logo />
        </Link>
        <div className="max-w-md">
          <p className="eyebrow">Why an account</p>
          <ul className="mt-4 space-y-4 text-[0.9375rem]">
            {[
              ["Optional", "Detection and history work without one. Your frames are analysed on your device either way."],
              ["Sync", "Signed-in scans are mirrored to your private cloud history, so they follow you to your phone."],
              ["Yours", "Row-level security means only you can read or delete your scans."],
            ].map(([k, v]) => (
              <li key={k} className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-border pt-4">
                <span className="readout text-sm text-primary">{k}</span>
                <span className="text-muted-foreground">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="readout text-xs text-muted-foreground">COCO-SSD · TensorFlow.js · Supabase</p>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" aria-label="VisionAI home" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-8">
          <div className="w-full max-w-sm motion-safe:animate-rise">{children}</div>
        </main>
      </div>
      <AuthToaster />
    </div>
  );
}
