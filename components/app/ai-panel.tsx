"use client";

import { useState } from "react";
import { Loader2, Sparkles, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { describeImage, useAiStatus } from "@/lib/ai";
import { AI_LANGUAGES } from "@/lib/coco";
import { updateSettings, useSettings } from "@/lib/settings";
import type { AiAnalysis } from "@/lib/types";
import { useSpeech } from "@/hooks/use-speech";

/**
 * Optional "Describe with AI": sends one frame to the server's OpenRouter vision models.
 * `getImage` returns a JPEG data URL of the frame to describe.
 */
export function AiPanel({
  getImage,
  result,
  onResult,
  disabled,
}: {
  getImage: () => Promise<string | null>;
  result?: AiAnalysis;
  onResult: (r: AiAnalysis) => void;
  disabled?: boolean;
}) {
  const { checked, configured } = useAiStatus();
  const { aiLanguage } = useSettings();
  const [busy, setBusy] = useState<false | "quick" | "deep">(false);
  const { speak, stop, speaking, supported } = useSpeech();

  const run = async (deep: boolean) => {
    setBusy(deep ? "deep" : "quick");
    try {
      const img = await getImage();
      if (!img) throw new Error("No frame to describe yet.");
      const r = await describeImage(img, aiLanguage, deep);
      onResult(r);
    } catch (err) {
      toast.error("AI description failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="ai-title" className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="ai-title" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-accent" aria-hidden /> Describe with AI
        </h2>
        <span className="readout text-xs text-muted-foreground">optional · cloud</span>
      </div>
      <div className="space-y-3 p-4">
        {checked && !configured ? (
          <p className="text-sm text-muted-foreground">
            Not configured on this server. Add <code className="readout text-xs">OPENROUTER_API_KEY</code> to enable
            written descriptions and translations. Detection above works without it.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Sends this one frame to a free vision-language model for an explanation and translation.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Select
                label="Translation language"
                value={aiLanguage}
                onValueChange={(v) => updateSettings({ aiLanguage: v })}
                options={AI_LANGUAGES.map((l) => ({ value: l, label: l }))}
              />
              <Button variant="secondary" disabled={disabled || !!busy || !checked} onClick={() => run(false)}>
                {busy === "quick" ? <Loader2 className="animate-spin" /> : null} Quick
              </Button>
              <Button variant="accent" disabled={disabled || !!busy || !checked} onClick={() => run(true)}>
                {busy === "deep" ? <Loader2 className="animate-spin" /> : <Sparkles />} Deep
              </Button>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-3 border-t border-border pt-3 motion-safe:animate-rise">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Main subject</p>
                <p className="mt-1 text-lg font-semibold">{result.object}</p>
              </div>
              {supported && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={speaking ? "Stop reading" : "Read aloud"}
                  onClick={() => (speaking ? stop() : speak(`${result.object}. ${result.explanation}`, "English"))}
                >
                  {speaking ? <Square /> : <Volume2 />}
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed">{result.explanation}</p>
            {result.translation && result.language !== "English" && (
              <div className="rounded-sm border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow">{result.language}</p>
                  {supported && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Read ${result.language} aloud`}
                      onClick={() => speak(`${result.translation!.object}. ${result.translation!.explanation}`, result.language)}
                    >
                      <Volume2 />
                    </Button>
                  )}
                </div>
                <p className="mt-1 font-medium">{result.translation.object}</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.translation.explanation}</p>
              </div>
            )}
            {result.deep_info && (
              <div>
                <p className="eyebrow">Background</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.deep_info}</p>
              </div>
            )}
            {!!result.examples?.length && (
              <div>
                <p className="eyebrow">Examples</p>
                <ul className="mt-1 list-inside list-[square] space-y-1 text-sm text-muted-foreground marker:text-primary">
                  {result.examples.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="readout text-xs text-muted-foreground">
              {result.detected_lang && result.detected_lang !== "none" ? `text: ${result.detected_lang} · ` : ""}
              {result.used_model}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
