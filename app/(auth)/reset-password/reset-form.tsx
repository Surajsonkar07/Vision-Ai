"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { createClient } from "@/lib/supabase/client";

const Schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });
type Values = z.infer<typeof Schema>;

type LinkState = "checking" | "valid" | "invalid";

export function ResetForm() {
  const router = useRouter();
  const [state, setState] = useState<LinkState>("checking");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;

  // The reset link signs the user in with a recovery session (code in the URL, exchanged by the client).
  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    void (async () => {
      const supabase = await createClient();
      if (!supabase) {
        if (!cancelled) setState("invalid");
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!cancelled && (event === "PASSWORD_RECOVERY" || session)) setState("valid");
      });
      unsub = () => data.subscription.unsubscribe();
      const { data: s } = await supabase.auth.getSession();
      if (!cancelled) setState(s.session ? "valid" : "invalid");
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    const supabase = await createClient();
    const { error: e } = (await supabase?.auth.updateUser({ password })) ?? {};
    if (e) {
      setError(e.message);
      return;
    }
    toast.success("Password updated", { description: "You're signed in." });
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <div>
      <p className="eyebrow">Password reset</p>
      <h1 className="mt-2 text-3xl font-semibold">Choose a new password.</h1>

      {state === "checking" && (
        <div className="mt-8 space-y-3" aria-busy="true" aria-label="Checking reset link">
          <div className="skeleton h-11" />
          <div className="skeleton h-11" />
        </div>
      )}

      {state === "invalid" && (
        <div className="mt-6 space-y-4" role="alert">
          <p className="text-muted-foreground">
            This page only works from the link in a password-reset e-mail, and each link can be used once. It may have
            expired.
          </p>
          <Button asChild>
            <Link prefetch={false} href="/forgot-password">Send a new link</Link>
          </Button>
        </div>
      )}

      {state === "valid" && (
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="password-err" {...form.register("password")} />
            <FieldError id="password-err">{errors.password?.message}</FieldError>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} aria-describedby="confirm-err" {...form.register("confirm")} />
            <FieldError id="confirm-err">{errors.confirm?.message}</FieldError>
          </div>
          {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} Save new password
          </Button>
        </form>
      )}
    </div>
  );
}
