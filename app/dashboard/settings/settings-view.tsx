"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Slider, Switch } from "@/components/ui/form-controls";
import { ThemeSegmented } from "@/components/theme-toggle";
import { AI_LANGUAGES } from "@/lib/coco";
import { signOut, useSession } from "@/lib/cloud";
import { loadDetector, useDetector } from "@/lib/detector";
import { exportJson } from "@/lib/export";
import { clearHistory, storageEstimate, useHistory } from "@/lib/history";
import { MODEL_INFO, updateSettings, useSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import type { ModelBase } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

function Row({ title, hint, htmlFor, children }: { title: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-[1fr_minmax(0,18rem)] sm:items-center sm:gap-8">
      <div>
        {htmlFor ? (
          <Label htmlFor={htmlFor}>{title}</Label>
        ) : (
          <p className="text-sm font-medium">{title}</p>
        )}
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`s-${title}`} className="rounded-md border border-border bg-surface px-4 sm:px-6">
      <h2 id={`s-${title}`} className="eyebrow border-b border-border py-3">
        {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name.").max(80),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters.")
    .max(32)
    .regex(/^[a-z0-9_.-]+$/i, "Letters, numbers, dot, dash and underscore only."),
});
type Profile = z.infer<typeof ProfileSchema>;

function ProfileForm({ userId, email, initial }: { userId: string; email: string; initial: Profile }) {
  const form = useForm<Profile>({ resolver: zodResolver(ProfileSchema), defaultValues: initial });
  const { errors, isSubmitting, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ userid: userId, email, ...values, updated_at: new Date().toISOString() }, { onConflict: "userid" });
    if (error) {
      toast.error("Profile not saved", { description: error.message.includes("username") ? "That username is taken." : error.message });
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: values.full_name, username: values.username } });
    form.reset(values);
    toast.success("Profile updated");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} aria-describedby="full_name-err" {...form.register("full_name")} />
        <FieldError id="full_name-err">{errors.full_name?.message}</FieldError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" autoComplete="username" aria-invalid={!!errors.username} aria-describedby="username-err" {...form.register("username")} />
        <FieldError id="username-err">{errors.username?.message}</FieldError>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} readOnly disabled />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" />} Save profile
        </Button>
        <Button type="button" variant="secondary" onClick={() => void signOut().then(() => toast.success("Signed out"))}>
          <LogOut /> Sign out
        </Button>
      </div>
    </form>
  );
}

function Account() {
  const { ready, user } = useSession();
  const [profile, setProfile] = useState<{ id: string; data: Profile } | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;
    supabase
      ?.from("profiles")
      .select("full_name, username")
      .eq("userid", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile({
          id: user.id,
          data: {
            full_name: data?.full_name ?? (user.user_metadata?.full_name as string) ?? "",
            username: data?.username ?? (user.user_metadata?.username as string) ?? "",
          },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!supabaseConfigured) {
    return (
      <p className="py-5 text-sm text-muted-foreground">
        Accounts are not configured on this server. Everything works in guest mode; scans are stored in this browser.
      </p>
    );
  }
  if (!ready) return <div className="my-5 skeleton h-24" />;
  if (!user) {
    return (
      <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Sign in to sync scans across devices and keep a profile.</p>
        <div className="flex gap-2">
          <Button asChild><Link href="/login">Sign in</Link></Button>
          <Button asChild variant="secondary"><Link href="/signup">Create account</Link></Button>
        </div>
      </div>
    );
  }
  if (profile?.id !== user.id) return <div className="my-5 skeleton h-40" />;
  return <ProfileForm key={user.id} userId={user.id} email={user.email ?? ""} initial={profile.data} />;
}

export function SettingsView() {
  const s = useSettings();
  const detector = useDetector();
  const { records } = useHistory();
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    storageEstimate().then((u) => !cancelled && setUsage(u));
    return () => {
      cancelled = true;
    };
  }, [records.length]);

  const local = records.filter((r) => !r.cloudOnly);

  return (
    <div className="space-y-6">
      <Section title="Appearance">
        <Row title="Theme" hint="System follows your device's light or dark setting.">
          <ThemeSegmented />
        </Row>
      </Section>

      <Section title="Detection">
        <Row title="Model" hint={MODEL_INFO[s.model].note} htmlFor="model">
          <Select
            id="model"
            label="Model"
            value={s.model}
            onValueChange={(v) => {
              updateSettings({ model: v as ModelBase });
              if (detector.status !== "idle") void loadDetector(v as ModelBase).catch(() => {});
            }}
            options={(Object.keys(MODEL_INFO) as ModelBase[]).map((k) => ({
              value: k,
              label: `${MODEL_INFO[k].short} — ${MODEL_INFO[k].name}`,
              hint: MODEL_INFO[k].size,
            }))}
          />
        </Row>
        <Row title="Default confidence threshold" hint="Objects scored below this are hidden. Each saved scan keeps its own value.">
          <div className="flex items-center gap-3">
            <Slider aria-label="Default confidence threshold" min={0.2} max={0.95} step={0.05} value={[s.threshold]} onValueChange={([v]) => updateSettings({ threshold: v })} />
            <span className="readout w-10 text-right text-sm">{s.threshold.toFixed(2)}</span>
          </div>
        </Row>
        <Row title="Maximum boxes per frame" hint="Fewer boxes is slightly faster on phones.">
          <div className="flex items-center gap-3">
            <Slider aria-label="Maximum boxes per frame" min={5} max={50} step={5} value={[s.maxBoxes]} onValueChange={([v]) => updateSettings({ maxBoxes: v })} />
            <span className="readout w-10 text-right text-sm">{s.maxBoxes}</span>
          </div>
        </Row>
        <Row title="Show labels on boxes" htmlFor="labels">
          <Switch id="labels" checked={s.showLabels} onCheckedChange={(v) => updateSettings({ showLabels: v })} />
        </Row>
        <Row title="Mirror the front camera" hint="Like a mirror. Saved captures keep what you saw." htmlFor="mirror">
          <Switch id="mirror" checked={s.mirrorFront} onCheckedChange={(v) => updateSettings({ mirrorFront: v })} />
        </Row>
        <Row title="Save uploads automatically" hint="Off: review each result and save it yourself." htmlFor="autosave">
          <Switch id="autosave" checked={s.autoSaveUploads} onCheckedChange={(v) => updateSettings({ autoSaveUploads: v })} />
        </Row>
        <Row title="Reset detection settings">
          <Button variant="secondary" onClick={() => (updateSettings({ ...DEFAULT_SETTINGS, aiLanguage: s.aiLanguage }), toast.success("Defaults restored"))}>
            Restore defaults
          </Button>
        </Row>
      </Section>

      <Section title="AI description">
        <Row title="Translation language" hint="Used by Describe with AI for the translated explanation and read-aloud." htmlFor="lang">
          <Select id="lang" label="Translation language" value={s.aiLanguage} onValueChange={(v) => updateSettings({ aiLanguage: v })} options={AI_LANGUAGES.map((l) => ({ value: l, label: l }))} />
        </Row>
      </Section>

      <Section title="Data on this device">
        <Row
          title={`${local.length} scan${local.length === 1 ? "" : "s"} stored`}
          hint={usage ? `${formatBytes(usage.usage)} used by this site of ${formatBytes(usage.quota)} available.` : "Stored in IndexedDB in this browser."}
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!local.length} onClick={() => exportJson(local)}>
              <Download /> Back up
            </Button>
            <ConfirmDialog
              title="Delete all local scans?"
              description={`${local.length} scans and their images will be removed from this browser. This cannot be undone.`}
              confirmLabel="Delete all"
              onConfirm={async () => {
                await clearHistory();
                toast.success("Local history cleared");
              }}
              trigger={
                <Button variant="secondary" disabled={!local.length}>
                  <Trash2 /> Clear
                </Button>
              }
            />
          </div>
        </Row>
      </Section>

      <Section title="Account">
        <Account />
      </Section>
    </div>
  );
}
