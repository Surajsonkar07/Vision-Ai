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

Other scripts: `npm run lint`, `npm run typecheck`, `npm run icons` (regenerates PWA icons from the monogram).

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

Kept from the previous version (all working):

- [x] Landing page
- [x] Sign up with e-mailed 6-digit OTP (`/api/auth/send-otp`, `/api/auth/verify-email`), auto sign-in
- [x] Sign in / sign out with Supabase; signed-in users are redirected away from `/login` and `/signup`
- [x] Dashboard overview with totals (scans, objects, accuracy) and recent scans
- [x] Live camera scan with device switching
- [x] Image / video upload with drag and drop
- [x] AI analysis via OpenRouter with model fallback, quick and deep mode, 60 languages, read-aloud (`/api/analyze`)
- [x] Saving detections to Supabase `detections` + storage bucket
- [x] History of detections
- [x] Analytics charts
- [x] Profile settings (full name, username)
- [x] Dark theme

New or made real in this rebuild:

- [x] Real object detection in the browser (COCO-SSD, 80 classes) — no key, works offline once cached
- [x] Bounding boxes with label + confidence on photos, video and live camera
- [x] Front/rear camera flip for phones, pause, capture (Space / C shortcuts), live fps + latency read-out
- [x] Batch image upload, clipboard paste, frame-by-frame video analysis with frame capture
- [x] Adjustable confidence threshold (live, per scan), max boxes, labels on/off, mirror front camera
- [x] Model choice: SSDLite MobileNet v2 (fast) or SSD MobileNet v2 (accurate); WebGL with CPU fallback
- [x] On-device history (IndexedDB): search by label, filter, sort, detail view, delete, clear, import
- [x] Export: CSV per detection, COCO annotation JSON, full JSON backup, annotated PNG
- [x] Guest mode — the console works without an account; signing in adds sync and pull from cloud
- [x] Analytics from real data: objects per day, class frequency, confidence histogram, latency by backend
- [x] Light, dark and system themes, designed separately (see `DESIGN.md`)
- [x] Mobile layout with bottom tab bar, 44 px touch targets
- [x] PWA: manifest, icons (incl. maskable), service worker with offline page; model weights cached
- [x] SEO: metadata, Open Graph, `sitemap.xml`, `robots.txt`

Removed: the decorative 3D eye (three.js/Spline), Remotion network animation, Lenis smooth scroll and custom
cursor. They added ~1 MB of JavaScript to every page and no function.

## How it is built

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix primitives (`radix-ui`), `motion`, `sonner`,
  `next-themes`, react-hook-form + zod, Serwist.
- `lib/detector.ts` dynamically imports TensorFlow.js and COCO-SSD only when a page needs them, after first paint
  (`requestIdleCallback`), and warms the model up on a blank frame.
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
