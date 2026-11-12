"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

const DetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
type Details = z.infer<typeof DetailsSchema>;

const CodeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email.") });
type Code = z.infer<typeof CodeSchema>;

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const detailsForm = useForm<Details>({ resolver: zodResolver(DetailsSchema), defaultValues: { fullName: "", email: "", password: "" } });
  const codeForm = useForm<Code>({ resolver: zodResolver(CodeSchema), defaultValues: { code: "" } });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const sendCode = detailsForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await post("/api/auth/send-otp", { email: values.email, fullName: values.fullName });
      setDetails(values);
      setStep("code");
      setCooldown(45);
      toast.success("Code sent", { description: `Check ${values.email}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code.");
    }
  });

  const resend = async () => {
    if (!details || cooldown > 0) return;
    setError(null);
    try {
      await post("/api/auth/send-otp", { email: details.email, fullName: details.fullName });
      setCooldown(45);
      toast.success("A new code is on its way");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend the code.");
    }
  };

  const verify = codeForm.handleSubmit(async ({ code }) => {
    if (!details) return;
    setError(null);
    try {
      await post("/api/auth/verify-email", { email: details.email, code, password: details.password, fullName: details.fullName });
      const supabase = createClient();
      const { error: signInError } = (await supabase?.auth.signInWithPassword({ email: details.email, password: details.password })) ?? {};
      if (signInError) throw signInError;
      toast.success("Account created", { description: "You're signed in. New scans will sync." });
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    }
  });

  const d = detailsForm.formState;
  const c = codeForm.formState;

  return (
    <div>
      <div className="flex items-center gap-2 readout text-xs text-muted-foreground" aria-label={`Step ${step === "details" ? 1 : 2} of 2`}>
        <span className={step === "details" ? "text-primary" : ""}>01 details</span>
        <span className="h-px w-6 bg-border-strong" aria-hidden />
        <span className={step === "code" ? "text-primary" : ""}>02 verify</span>
      </div>

      {step === "details" ? (
        <>
          <h1 className="mt-3 text-3xl font-semibold">Create an account.</h1>
          <p className="mt-2 text-muted-foreground">We&apos;ll email a 6-digit code to confirm the address.</p>
          {!supabaseConfigured && (
            <p className="mt-6 rounded-sm border border-border bg-surface-2 p-3 text-sm text-muted-foreground" role="status">
              Accounts are not configured on this server.{" "}
              <Link href="/dashboard" className="font-medium text-foreground underline underline-offset-4">Use the console as a guest</Link>.
            </p>
          )}
          <form onSubmit={sendCode} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" autoComplete="name" aria-invalid={!!d.errors.fullName} aria-describedby="fullName-err" {...detailsForm.register("fullName")} />
              <FieldError id="fullName-err">{d.errors.fullName?.message}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!d.errors.email} aria-describedby="email-err" {...detailsForm.register("email")} />
              <FieldError id="email-err">{d.errors.email?.message}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!d.errors.password} aria-describedby="password-err password-hint" {...detailsForm.register("password")} />
              <p id="password-hint" className="text-xs text-muted-foreground">At least 8 characters.</p>
              <FieldError id="password-err">{d.errors.password?.message}</FieldError>
            </div>
            {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={d.isSubmitting || !supabaseConfigured}>
              {d.isSubmitting && <Loader2 className="animate-spin" />} Send verification code
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold">
            <MailCheck className="size-7 text-primary" aria-hidden /> Check your inbox.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter the code sent to <span className="font-medium text-foreground">{details?.email}</span>. It expires in 15 minutes.
          </p>
          <form onSubmit={verify} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="h-14 text-center readout text-2xl tracking-[0.5em]"
                aria-invalid={!!c.errors.code}
                aria-describedby="code-err"
                {...codeForm.register("code")}
              />
              <FieldError id="code-err">{c.errors.code?.message}</FieldError>
            </div>
            {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={c.isSubmitting}>
              {c.isSubmitting && <Loader2 className="animate-spin" />} Verify and create account
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => (setStep("details"), setError(null))} className="inline-flex h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Change details
              </button>
              <button type="button" onClick={() => void resend()} disabled={cooldown > 0} className="h-11 font-medium underline underline-offset-4 disabled:no-underline disabled:opacity-60">
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        </>
      )}

      <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
