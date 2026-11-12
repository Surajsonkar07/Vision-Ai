"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Camera,
  History,
  ImageUp,
  LayoutGrid,
  LogIn,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModelStatus } from "./model-status";
import { loadHistory } from "@/lib/history";
import { pullCloud, signOut, startSession, useSession } from "@/lib/cloud";
import { supabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/dashboard", label: "Overview", short: "Overview", Icon: LayoutGrid },
  { href: "/dashboard/webcam", label: "Live scan", short: "Live", Icon: Camera },
  { href: "/dashboard/upload", label: "Upload", short: "Upload", Icon: ImageUp },
  { href: "/dashboard/history", label: "History", short: "History", Icon: History },
  { href: "/dashboard/analytics", label: "Analytics", short: "Stats", Icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", short: "Settings", Icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function AccountBlock() {
  const { ready, user } = useSession();
  if (!supabaseConfigured) {
    return <p className="px-2 text-xs text-muted-foreground">Guest mode · history on this device</p>;
  }
  if (!ready) return <div className="skeleton h-11" />;
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-11 items-center gap-2.5 rounded-sm px-2 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <LogIn className="size-4" aria-hidden /> Sign in to sync
      </Link>
    );
  }
  const name = (user.user_metadata?.full_name as string) || user.email || "Account";
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-2 text-muted-foreground">
        <UserRound className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="readout truncate text-xs text-muted-foreground">cloud sync on</p>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="grid size-9 place-items-center rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { user } = useSession();

  useEffect(() => {
    startSession();
    void loadHistory();
  }, []);

  useEffect(() => {
    if (user) void loadHistory().then(() => pullCloud());
  }, [user]);

  const current = NAV.find((n) => isActive(pathname, n.href));

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
          <div className="flex h-16 items-center px-5">
            <Link href="/" aria-label="VisionAI home">
              <Logo />
            </Link>
          </div>
          <nav aria-label="Console" className="flex-1 space-y-0.5 px-3 py-2">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3 rounded-sm px-3 text-sm transition-colors",
                    active
                      ? "bg-surface-2 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface-2/70 hover:text-foreground",
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 bg-primary" aria-hidden />}
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-border p-3">
            <ModelStatus />
            <AccountBlock />
            <div className="flex items-center justify-between">
              <span className="readout text-xs text-muted-foreground">v1.0</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Mobile / tablet top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:hidden">
            <Link href="/" aria-label="VisionAI home" className="pl-1">
              <Logo />
            </Link>
            <div className="flex items-center">
              <span className="sr-only">Current section: {current?.label}</span>
              <ModelStatus compact />
              <ThemeToggle />
              <Link
                href="/dashboard/settings"
                aria-label="Settings"
                className={cn(
                  "grid size-11 place-items-center rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  pathname.startsWith("/dashboard/settings") && "text-foreground",
                )}
              >
                <Settings className="size-[1.125rem]" />
              </Link>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Console"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
        >
          {NAV.slice(0, 5).map(({ href, short, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 bg-primary" aria-hidden />}
                <Icon className="size-5" aria-hidden />
                {short}
              </Link>
            );
          })}
        </nav>
      </div>
      <Toaster
        theme={(resolvedTheme as "light" | "dark") ?? "system"}
        position="top-center"
        offset={16}
        mobileOffset={{ top: 64 }}
        toastOptions={{
          classNames: {
            toast: "!rounded-md !border !border-border !bg-surface !text-foreground !shadow-pop !font-sans",
            description: "!text-muted-foreground",
          },
        }}
      />
    </MotionConfig>
  );
}
