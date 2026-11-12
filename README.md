# VisionAI — on-device object detection

VisionAI finds objects in photos, video files and the live camera (laptop or phone) and draws labelled
bounding boxes with confidence scores. Detection runs **in the browser** with TensorFlow.js and the
COCO-SSD model (80 classes), so it needs no paid API key and frames never leave the device.
Scans are kept in on-device history and can be exported as CSV, COCO annotations, JSON or annotated PNG.

Optional extras, if you add keys:

- **Accounts + cloud sync** (Supabase): sign up with an e-mailed 6-digit code (Mailjet), sign in,
  scans mirror to your private `detections` table and images to the `detections` storage bucket.
- **Describe with AI** (OpenRouter, free vision models): a written explanation of one frame,
  translated into 60 languages, with read-aloud.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (Turbopack, service worker off)
npm run build        # production build (webpack, generates the service worker)
npm start
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm run icons` (regenerates PWA icons from the monogram),
`npm run e2e` (headless-Chrome smoke test against a running server; set `BASE_URL`, e.g. `BASE_URL=http://localhost:3000`).

Requires Node 20+. The camera needs a secure context: `localhost` or HTTPS. To test on a phone,
deploy (e.g. Vercel) or use an HTTPS tunnel; plain `http://<lan-ip>:3000` will not get camera access.

## Environment variables

All optional — without them the app runs in guest mode with full detection, history and export.
See `.env.example`.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign in, profile, cloud sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: OTP sign-up creates the user |
| `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL` | Sending the sign-up code |
| `OPENROUTER_API_KEY` | Describe with AI |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs in metadata, sitemap, robots |

Database: run `supabase_schema.sql` in the Supabase SQL editor. The block at the end (v1.0) adds the
UPDATE/DELETE policies needed for sync.

## Features

Requirements and acceptance criteria are in [docs/PRD.md](docs/PRD.md); the technical design and a feature→code
traceability table are in [docs/TRD.md](docs/TRD.md). Status key: **verified** = checked in a production build
(headless Chrome E2E or manual), **done** = implemented, lint/type-checked and built, but needs the owner's live
services or a real device to verify end to end.

| ID | Feature | Status |
|---|---|---|
| F-01 | Landing page | verified |
| F-02 | In-browser detector (COCO-SSD, WebGL/CPU, Lite/Full, status, lazy load) | verified |
| F-03 | Live camera scan (flip, pause, capture, HUD, errors) | verified with Chrome's fake camera; real phone camera needs HTTPS — done |
| F-04 | Photo upload (batch, drag/drop, paste, queue, auto-save) | verified |
| F-05 | Video file analysis + frame capture | done (not exercised with a real clip) |
| F-06 | Boxes, labels, confidence, table, class colours | verified |
| F-07 | Confidence threshold and detection settings | verified |
| F-08 | Class filter | verified |
| F-09 | Scan history on device (search, filter, sort, clear, empty state) | verified |
| F-10 | Scan detail (threshold, table, metadata, delete) | verified |
| F-11 | Export CSV / COCO / JSON / PNG and import JSON | done (export code paths built; downloads not opened in CI) |
| F-12 | Analytics | verified |
| F-13 | Console overview | verified |
| F-14 | Describe with AI (OpenRouter, 60 languages, read-aloud) | done; `GET /api/analyze` verified — model calls not exercised against the owner's key |
| F-15 | Sign up with e-mail OTP | done; needs live Supabase + Mailjet to verify |
| F-16 | Sign in / sign out, redirects | done; needs live Supabase to verify |
| F-17 | Password reset | done; needs Supabase redirect URL for `/reset-password` |
| F-18 | Profile | done; needs live Supabase to verify |
| F-19 | Cloud sync | done; needs live Supabase (run `supabase_schema.sql` v1.0 block) |
| F-20 | Settings and data management | verified |
| F-21 | Light / dark / system themes | verified |
| F-22 | PWA and offline | verified (installable manifest, SW active, `/offline` fallback) |
| F-23 | SEO and metadata | verified |
| F-24 | Loading, error, empty and 404 states | verified |
| F-25 | Rate limits on API routes | done (429 path verified locally) |

Removed: the decorative 3D eye (three.js/Spline), Remotion network animation, Lenis smooth scroll and custom
cursor. They added ~1 MB of JavaScript to every page and no function.

## How it is built

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix primitives (`radix-ui`), `motion`, `sonner`,
  `next-themes`, react-hook-form + zod, Serwist.
- `lib/detector.ts` dynamically imports TensorFlow.js and COCO-SSD only on the detection pages, starting on the
  user's first interaction (or when a scan is requested), so the model never competes with first paint. It warms
  the model up on a blank frame so the first real scan is fast.
- `lib/history.ts` stores records (with a 320 px thumbnail) and full images (≤1280 px JPEG) in two IndexedDB stores.
- `lib/cloud.ts` handles optional Supabase sync; `proxy.ts` refreshes the auth cookie.
- `app/sw.ts` is the Serwist service worker. COCO-SSD weights (Google Cloud Storage) are cached cache-first.

| Route | What |
|---|---|
| `/` | Landing |
| `/dashboard` | Overview |
| `/dashboard/webcam` | Live scan |
| `/dashboard/upload` | Photos and video |
| `/dashboard/history`, `/dashboard/history/[id]` | History and scan detail |
| `/dashboard/analytics` | Analytics |
| `/dashboard/settings` | Preferences, data, account |
| `/login`, `/signup` | Accounts (optional) |
| `/offline` | Service-worker fallback |

## Verification (12 Nov 2026, v1.1)

- `npm run lint`, `npm run typecheck` and `npm run build` (webpack + Serwist) pass.
- `npm run e2e` against the production build: all checks pass —
  no horizontal overflow on 12 pages at 360/390/768/1280 px; sample photo → 7 objects (4 people, 3 kites), auto-saved;
  class filter *kite* → 3 of 7 shown with the badge, while the saved scan still shows every class; history, detail,
  analytics and overview reflect the scans; live loop ~7 fps with Chrome's fake camera (WebGL); service worker active;
  `GET /api/analyze` contract; no console errors.
- Rate limit: 21st `POST /api/analyze` within 10 minutes returns 429 with `Retry-After`.
- Lighthouse (mobile, simulated throttling, heavily loaded shared machine): Accessibility, Best Practices and SEO 100
  on `/`, `/dashboard`, `/dashboard/upload`, `/dashboard/webcam`, `/login`; Performance 75–82 (target 90 not met here;
  observed LCP ~0.3 s). Re-measure on the deployed site.
- Not verified here (needs the owner's live services or a device): real phone camera over HTTPS, OTP sign-up,
  sign-in, password-reset e-mail, profile save, cloud sync, AI description calls, file downloads of exports.
