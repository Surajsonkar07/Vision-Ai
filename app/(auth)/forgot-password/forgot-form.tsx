"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

const Schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address.") });
type Values = z.infer<typeof Schema>;

export function ForgotForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    const supabase = await createClient();
    if (!supabase) return;
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Don't reveal whether the address has an account; only surface rate-limit / network problems.
    if (e && /rate|limit|network|fetch/i.test(e.message)) {
      setError(e.message);
      return;
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <div>
        <p className="eyebrow">Password reset</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold">
          <MailCheck className="size-7 text-primary" aria-hidden /> Check your inbox.
        </h1>
        <p className="mt-3 text-muted-foreground" role="status">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a reset link is on its way.
          Open it on this device to choose a new password.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
          <Button variant="secondary" onClick={() => setSentTo(null)}>Use another e-mail</Button>
          <Button asChild variant="ghost">
            <Link prefetch={false} href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Password reset</p>
      <h1 className="mt-2 text-3xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-muted-foreground">Enter your account e-mail and we&apos;ll send a link to set a new one.</p>

      {!supabaseConfigured && (
        <p className="mt-6 rounded-sm border border-border bg-surface-2 p-3 text-sm text-muted-foreground" role="status">
          Accounts are not configured on this server.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="email-err" {...form.register("email")} />
          <FieldError id="email-err">{errors.email?.message}</FieldError>
        </div>
        {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !supabaseConfigured}>
          {isSubmitting && <Loader2 className="animate-spin" />} Send reset link
        </Button>
      </form>

      <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link prefetch={false} href="/login" className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
