"use client";

import { useEffect } from "react";
import { createStore, useStore } from "./store";
import type { AiAnalysis } from "./types";

/** Whether the server has an OpenRouter key (checked once, lazily). */
const aiStatus = createStore<{ checked: boolean; configured: boolean }>({ checked: false, configured: false });
let checking = false;

export function useAiStatus() {
  const s = useStore(aiStatus, { checked: false, configured: false });
  useEffect(() => {
    if (checking) return;
    checking = true;
    fetch("/api/analyze", { method: "GET" })
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => aiStatus.set({ checked: true, configured: Boolean(d.configured) }))
      .catch(() => aiStatus.set({ checked: true, configured: false }));
  }, []);
  return s;
}

export async function describeImage(image: string, language: string, deep: boolean): Promise<AiAnalysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, targetLanguage: language, deepSearch: deep }),
  });
  const data = await res.json().catch(() => ({ error: "The AI service returned an unreadable response." }));
  if (!res.ok || data.error) throw new Error(data.error || "AI description failed.");
  return { ...data, language, deep } as AiAnalysis;
}
