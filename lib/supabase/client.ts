"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

let client: Promise<SupabaseClient> | null = null;

/**
 * Browser client, or null when Supabase env vars are not set (guest-only mode).
 * The SDK is imported lazily so it never sits on the first-paint path; accounts are optional.
 */
export function createClient(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return Promise.resolve(null);
  client ??= import("@supabase/ssr").then(({ createBrowserClient }) =>
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY),
  );
  return client;
}
