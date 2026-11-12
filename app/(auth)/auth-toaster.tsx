"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function AuthToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={(resolvedTheme as "light" | "dark") ?? "system"}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-md !border !border-border !bg-surface !text-foreground !shadow-pop !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
