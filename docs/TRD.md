# VisionAI — Technical Requirements Document

Version 1.1 · 12 Nov 2026 · Implements [PRD.md](./PRD.md) · Design tokens: [../DESIGN.md](../DESIGN.md)

## 1. Architecture

```
 Browser (client)                                              Server (Next.js 16, Node runtime)
 ┌──────────────────────────────────────────────────────┐      ┌──────────────────────────────────────┐
 │ App Router pages (RSC shells + client islands)        │      │ proxy.ts  → refresh Supabase cookie,  │
 │  ├─ Landing (server components, CSS-only animation)   │      │            redirect signed-in users   │
 │  └─ Console (AppShell client layout)                  │      │            away from /login,/signup   │
 │                                                       │      │                                      │
 │ lib/detector.ts ──dynamic import──► TF.js core        │      │ /api/analyze ───────► OpenRouter      │
 │   WebGL backend │ CPU fallback      + COCO-SSD        │      │   (zod, rate limit, model fallback)   │
 │        ▲ weights (GCS, cached by SW)                  │      │ /api/auth/send-otp ─► Supabase admin  │
 │ lib/history.ts ──► IndexedDB (scans, images)          │      │   (zod, rate limit)  └► Mailjet       │
 │ lib/settings.ts ─► localStorage                       │      │ /api/auth/verify-email ► Supabase     │
 │ lib/cloud.ts ──lazy import──► @supabase/ssr ─────────────────►  admin (create user, profile)         │
 │   (auth, detections table, storage bucket)            │      │                                      │
 │ app/sw.ts (Serwist service worker)                    │      │ lib/rate-limit.ts (in-memory window)  │
 └──────────────────────────────────────────────────────┘      └──────────────────────────────────────┘
                     │                                                         │
                     ▼                                                         ▼
            Supabase (Auth, Postgres + RLS, Storage)               Mailjet API, OpenRouter API
```

Detection never touches the server. The server only handles optional accounts (OTP), the optional AI
description, and session cookie refresh.

## 2. Stack (exact installed versions)

| Package | Version | Why |
|---|---|---|
| next | 16.4.6 | App Router, RSC, metadata API, `proxy.ts` |
| react / react-dom | 19.3.1 | |
| typescript | 5.9.3 | Next's type-check needs TS 5 (not 7) |
| tailwindcss / @tailwindcss/postcss | 4.3.5 | CSS-first tokens (`@theme inline`) |
| radix-ui | 1.8.1 | Accessible primitives (Select, Slider, Switch, Dialog, DropdownMenu, Label, Slot) |
| motion | 12.43.0 | List/presence animation on history, upload, live scan only |
| next-themes | 0.4.6 | light/dark/system without flash |
| sonner | 2.0.8 | toasts |
| react-hook-form / @hookform/resolvers / zod | 7.92.0 / 5.9.2 / 4.6.7 | forms + shared validation |
| @tensorflow/tfjs-core, -converter, -backend-webgl, -backend-cpu | 4.22.0 | in-browser inference (modular, smaller than `@tensorflow/tfjs`) |
| @tensorflow-models/coco-ssd | 2.2.3 | 80-class SSD detector |
| idb-keyval | 6.3.0 | tiny IndexedDB wrapper |
| @supabase/ssr / @supabase/supabase-js | 0.8.0 / 2.119.0 | optional auth, sync |
| @serwist/next / serwist | 9.5.13 | service worker (webpack build) |
| lucide-react | 0.575.0 | icons |
| eslint / eslint-config-next | 9.39.5 / 16.4.6 | lint incl. React Compiler rules |

Build: `next build --webpack` (Serwist hooks webpack). Dev: `next dev` (Turbopack, SW disabled).

**Folders**
```
app/                 routes (see §3), sw.ts, manifest.ts, robots.ts, sitemap.ts, opengraph-image.tsx
  (auth)/            login, signup, forgot-password, reset-password (+ layout, toaster)
  dashboard/         console routes; *-view.tsx / *-list.tsx are the client islands
  api/               route handlers
components/ui/       button, form-controls (Input, Label, Select, Slider, Switch, FieldError), dialog
components/app/      app-shell, model-status, stage (SVG overlay + table), ai-panel, export-menu, bits, motion-root, class-filter
components/landing/  viewfinder (hero SVG)
lib/                 detector, history, settings, image, export, stats, cloud, ai, scan, coco, colors, store, rate-limit, utils, supabase/*
scripts/             make-icons.mjs, e2e-smoke.mjs
docs/                PRD.md, TRD.md
```

## 3. Route map

| Route | Type | Rendering | Feature |
|---|---|---|---|
| `/` | page | static (RSC) | F-01 |
| `/dashboard` | page | static shell + client | F-13 |
| `/dashboard/webcam` | page | static shell + client | F-03, F-07, F-08, F-14 |
| `/dashboard/upload` | page | static shell + client | F-04, F-05, F-06, F-07, F-08, F-14 |
| `/dashboard/history` | page | static shell + client | F-09, F-11, F-19 |
| `/dashboard/history/[id]` | page | dynamic shell + client | F-10, F-11, F-14 |
| `/dashboard/analytics` | page | static shell + client | F-12 |
| `/dashboard/settings` | page | static shell + client | F-07, F-08, F-18, F-20, F-21 |
| `/login` `/signup` | page | static + client form | F-15, F-16 |
| `/forgot-password` `/reset-password` | page | static + client form | F-17 |
| `/offline` | page | static | F-22 |
| `/manifest.webmanifest` `/sw.js` | PWA | generated | F-22 |
| `/robots.txt` `/sitemap.xml` `/opengraph-image` | metadata | generated | F-23 |
| `POST /api/analyze`, `GET /api/analyze` | route handler | dynamic | F-14, F-25 |
| `POST /api/auth/send-otp` | route handler | dynamic | F-15, F-25 |
| `POST /api/auth/verify-email` | route handler | dynamic | F-15, F-25 |

`proxy.ts` matcher: `/login`, `/signup`, `/dashboard/:path*`.

## 4. Data model

**Client (IndexedDB)** — DB `visionai-scans` / store `scans` (key = id) and DB `visionai-images` / store `images` (key = id → JPEG Blob ≤ 1280 px).

```ts
type BBox = [x: number, y: number, w: number, h: number];          // image pixels of the stored image
interface Detection { label: string; score: number; bbox: BBox }   // label ∈ COCO-80
interface AiAnalysis { object; explanation; translation?: {object; explanation}; detected_lang?; deep_info?;
                       examples?: string[]; used_model?; language: string; deep: boolean }
interface ScanRecord {
  id: string /* uuid v4 */; createdAt: number /* ms */; source: "upload" | "camera" | "video";
  name: string; width: number; height: number; thumb: string /* data:image/jpeg ≤ 320 px */;
  detections: Detection[] /* all ≥ 0.20 */; threshold: number; latencyMs: number; model: string; backend: string;
  ai?: AiAnalysis; syncedAt?: number; remoteUrl?: string; cloudOnly?: boolean;
}
```

**Client (localStorage)** `visionai.settings.v1`:
`{ model: "lite_mobilenet_v2"|"mobilenet_v2", threshold: 0.2–0.95, maxBoxes: 5–50, showLabels, mirrorFront, autoSaveUploads, aiLanguage, classFilter: string[] /* [] = all */ }`

**Supabase (Postgres, `supabase_schema.sql`)**

| Table | Columns | Notes |
|---|---|---|
| `detections` | `id uuid pk`, `created_at timestamptz`, `user_id uuid → auth.users`, `file_path text`, `file_type text`, `objects_detected jsonb` (visible detections), `accuracy float` (mean score), `latency float` (s), `metadata jsonb` (source, name, width, height, model, backend, threshold, all_detections, ai) | RLS: owner select/insert/update/delete |
| `profiles` | `userid uuid pk → auth.users`, `email`, `full_name`, `username unique (≥3)`, `avatar_url`, `website`, `updated_at` | trigger creates row on sign-up; RLS: public read, owner write |
| `verification_tokens` | `id`, `user_id uuid` (sha-256 of e-mail as uuid), `token text`, `expires_at`, `created_at` | service role only |
| storage `detections` | `scans/{userId}/{scanId}.jpg` | public read, authenticated insert/update |

## 5. API contracts

All JSON. Errors: `{ "error": string }`. 429 responses include `Retry-After` (seconds).

**`GET /api/analyze`** → `200 { configured: boolean }` (whether `OPENROUTER_API_KEY` exists). No auth.

**`POST /api/analyze`** — no auth (guest feature), rate-limited.
- Request: `{ image: string /* data:image/… ≤ 12 MB */, targetLanguage?: string /* 2–40, default English */, deepSearch?: boolean }`
- 200: `{ object, explanation, translation: {object, explanation}, detected_lang, deep_info?, examples?, used_model }`
- 400 invalid body · 429 > 20 req / 10 min / IP · 502 all models failed · 503 key not configured.

**`POST /api/auth/send-otp`** — no auth, rate-limited.
- Request: `{ email: string(email), fullName?: string ≤ 120 }`
- 200: `{ success: true, message }` · 400 invalid / already registered · 429 > 3 / 10 min per e-mail or > 10 / h per IP · 500 Supabase/Mailjet config or send failure.
- Effects: deletes old tokens for the e-mail, stores a 6-digit `crypto.randomInt` code valid 15 min, sends via Mailjet v3.1.

**`POST /api/auth/verify-email`** — no auth, rate-limited.
- Request: `{ email, code: /^\d{6}$/, password: string 8–128, fullName? }`
- 200: `{ success: true, user: { id, email } }` · 400 invalid/expired code or create-user error · 429 > 10 / 15 min per e-mail.
- Effects: creates confirmed auth user (service role), upserts profile, deletes token.

Client-side Supabase calls (RLS-protected, anon key + user JWT): `auth.signInWithPassword`, `auth.signOut`,
`auth.resetPasswordForEmail(email, { redirectTo: origin + "/reset-password" })`, `auth.updateUser({ password })`,
`auth.updateUser({ data })`, `profiles` select/upsert, `detections` upsert/select/delete, storage upload/getPublicUrl.

## 6. State, auth, validation

- **Stores:** tiny `createStore` + `useSyncExternalStore` (`lib/store.ts`) for detector status, history, settings, session, AI status — no external state library. `useHydrated()` for client-only rendering without hydration mismatch.
- **Auth:** Supabase cookie session; `proxy.ts` refreshes it. Console is open to guests by design (PRD F-02/F-09); signed-in state only adds sync and profile. Roles: single role (owner of own rows).
- **Validation (zod):** analyze body; send-otp `{email, fullName}`; verify `{email, code, password, fullName}`; client forms: login `{email, password}`, signup details `{fullName ≥2, email, password ≥8}`, code `{code 6 digits}`, profile `{full_name 1–80, username 3–32 /^[a-z0-9_.-]+$/i}`, forgot `{email}`, reset `{password ≥8, confirm = password}`. Imported JSON is shape-checked before writing to IndexedDB.

## 7. Integrations and environment

| Variable | Scope | Purpose | When missing |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | auth, sync, profile | guest-only mode; auth pages show "not configured" |
| `SUPABASE_SERVICE_ROLE_KEY` | server | OTP sign-up creates users | send-otp/verify return 500 with a clear message |
| `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL` | server | send OTP e-mail | send-otp returns 500 "Mailjet API configuration missing" |
| `OPENROUTER_API_KEY` | server | Describe with AI | `GET` reports `configured:false`; panel explains; POST 503 |
| `NEXT_PUBLIC_SITE_URL` | both | metadata base, sitemap, robots | falls back to `http://localhost:3000` |

External: COCO-SSD weights from `storage.googleapis.com/tfjs-models/savedmodel/...` (public, cached by SW).

## 8. Design system implementation

See `DESIGN.md`. Tokens are OKLCH CSS variables in `app/globals.css` (`:root` light, `.dark` dark) mapped to Tailwind via
`@theme inline` (`bg-surface`, `text-muted-foreground`, `bg-primary`, …). Fonts by `next/font/google`: Archivo (wdth axis, display),
IBM Plex Sans (UI), IBM Plex Mono (read-outs). Radius 2/4/6/8 px. Class colours: golden-angle hue by COCO id at L 0.83 C 0.16
(`lib/colors.ts`). Motion: 150–260 ms ease-out; entrance keyframe starts at opacity 0.35 (keeps LCP); scroll reveals are
progressive (`components/reveal.tsx`); everything off under `prefers-reduced-motion`.

## 9. PWA

- `app/manifest.ts`: id `/`, start `/dashboard`, standalone, theme/background `#0f1114`, icons 192/512/maskable 512, shortcuts.
- `app/sw.ts` (Serwist): precache build assets; `CacheFirst` `tfjs-models` cache for GCS/TF Hub/Kaggle weight hosts (64 entries, 90 days);
  `defaultCache` (network-first pages and API, stale-while-revalidate static); navigation fallback `/offline`; `skipWaiting`, `clientsClaim`, navigation preload.
- Registered manually after `load` in production (`components/sw-register.tsx`); `/sw.js` served `no-cache`.

## 10. Performance, security, testing, deployment

**Performance budget**
- Landing first-load JS ≤ 200 KB gz; no TF.js, Supabase or motion on `/`.
- Console pages: TF.js (~1 MB) and weights only after interaction/scan; Supabase SDK lazy (`lib/supabase/client.ts` returns a promise).
- No route prefetching from landing/auth links; console nav prefetches on hover/focus/touch.

**Security**
- Headers (`next.config.ts`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(), geolocation=()`, `poweredByHeader: false`.
- Rate limits: `lib/rate-limit.ts` fixed-window counters in memory keyed by IP (`x-forwarded-for`/`x-real-ip`) or e-mail. Best-effort on multi-instance hosting (PRD §9).
- Secrets only in server code (`server-only` on admin client). RLS on all tables. OTP from `crypto.randomInt`.

**Testing**
- Static: `npm run lint`, `npm run typecheck`, `npm run build`.
- E2E smoke (`npm run e2e`, `scripts/e2e-smoke.mjs`): launches headless Chrome over CDP against a running server, checks every page for horizontal overflow at 360/390/768/1280 px, uploads a sample photo and asserts detections are found and saved, opens history/detail/analytics, checks the service worker and console errors.
- Manual: real phone camera over HTTPS; sign-up/sign-in/reset against the Supabase project; AI description.
- Lighthouse mobile on `/`, `/dashboard`, `/dashboard/upload`, `/dashboard/webcam`, `/login`.

**Deployment:** Vercel (or any Node host). Set env vars from §7; add `https://<domain>/reset-password` to Supabase Auth redirect URLs; run `supabase_schema.sql`.

## 11. Traceability

| PRD | Implemented in |
|---|---|
| F-01 | `app/page.tsx`, `components/landing/viewfinder.tsx`, `components/reveal.tsx`, `lib/coco.ts` |
| F-02 | `lib/detector.ts`, `components/app/model-status.tsx`, `lib/settings.ts` (MODEL_INFO) |
| F-03 | `app/dashboard/webcam/live-scanner.tsx`, `lib/image.ts` (drawDetections, toCanvas), `lib/scan.ts` |
| F-04 | `app/dashboard/upload/uploader.tsx`, `lib/scan.ts` |
| F-05 | `app/dashboard/upload/video-analyzer.tsx` |
| F-06 | `components/app/stage.tsx` (Stage, DetectionTable, ClassSummary), `lib/colors.ts` |
| F-07 | `lib/settings.ts`, `components/ui/form-controls.tsx` (Slider), settings/live/upload/detail views |
| F-08 | `lib/settings.ts` (classFilter, applyFilter), `components/app/class-filter.tsx`, live/upload/video views |
| F-09 | `lib/history.ts`, `app/dashboard/history/history-list.tsx` |
| F-10 | `app/dashboard/history/[id]/scan-detail.tsx` |
| F-11 | `lib/export.ts`, `components/app/export-menu.tsx`, `lib/image.ts` (annotatedPng), `lib/history.ts` (importRecords) |
| F-12 | `lib/stats.ts`, `app/dashboard/analytics/analytics-view.tsx` |
| F-13 | `app/dashboard/overview.tsx`, `components/app/bits.tsx` |
| F-14 | `app/api/analyze/route.ts`, `lib/ai.ts`, `components/app/ai-panel.tsx`, `hooks/use-speech.ts` |
| F-15 | `app/(auth)/signup/signup-form.tsx`, `app/api/auth/send-otp/route.ts`, `app/api/auth/verify-email/route.ts`, `lib/auth-utils.ts`, `lib/supabase/admin.ts` |
| F-16 | `app/(auth)/login/login-form.tsx`, `proxy.ts`, `lib/supabase/proxy.ts`, `lib/cloud.ts` (session, signOut), `components/app/app-shell.tsx` |
| F-17 | `app/(auth)/forgot-password/*`, `app/(auth)/reset-password/*` |
| F-18 | `app/dashboard/settings/settings-view.tsx` (ProfileForm) |
| F-19 | `lib/cloud.ts`, `lib/scan.ts`, history list/detail, `supabase_schema.sql` |
| F-20 | `app/dashboard/settings/settings-view.tsx`, `lib/history.ts` (storageEstimate, clearHistory) |
| F-21 | `components/theme-provider.tsx`, `components/theme-toggle.tsx`, `app/globals.css`, `DESIGN.md` |
| F-22 | `app/manifest.ts`, `app/sw.ts`, `components/sw-register.tsx`, `app/offline/page.tsx`, `scripts/make-icons.mjs`, `next.config.ts` |
| F-23 | `app/layout.tsx` (metadata), `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, per-page `metadata` |
| F-24 | `app/**/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `components/app/bits.tsx` (EmptyState), sonner toasts |
| F-25 | `lib/rate-limit.ts`, the three route handlers |
