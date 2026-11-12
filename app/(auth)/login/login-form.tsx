"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

const Schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof Schema>;

export function LoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setServerError(null);
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setServerError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
      return;
    }
    toast.success("Signed in", { description: "New scans will sync to your account." });
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <div>
      <p className="eyebrow">Sign in</p>
      <h1 className="mt-2 text-3xl font-semibold">Welcome back.</h1>
      <p className="mt-2 text-muted-foreground">Sign in to sync your scans across devices.</p>

      {!supabaseConfigured && (
        <p className="mt-6 rounded-sm border border-border bg-surface-2 p-3 text-sm text-muted-foreground" role="status">
          Accounts are not configured on this server. You can still{" "}
          <Link href="/dashboard" className="font-medium text-foreground underline underline-offset-4">use the console as a guest</Link>.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby="email-err" {...form.register("email")} />
          <FieldError id="email-err">{errors.email?.message}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="pr-11"
              aria-invalid={!!errors.password}
              aria-describedby="password-err"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError id="password-err">{errors.password?.message}</FieldError>
        </div>
        {serverError && (
          <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !supabaseConfigured}>
          {isSubmitting && <Loader2 className="animate-spin" />} Sign in
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          New here?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary">
            Create an account
          </Link>
        </p>
        <p>
          Or{" "}
          <Link href="/dashboard" className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary">
            continue as a guest
          </Link>{" "}
          — scans stay on this device.
        </p>
      </div>
    </div>
  );
}
