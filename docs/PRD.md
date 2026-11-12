# VisionAI — Product Requirements Document

Version 1.1 · 12 Nov 2026 · Owner: project owner (VisionAI) · Status: implemented (see README for per-feature status)

## 1. Overview

**What it is.** VisionAI is a web app that finds and labels everyday objects in images. Point a laptop or phone
camera at a scene, or drop in photos or a video, and it draws a box around each object it recognises,
names it (one of 80 COCO classes, e.g. *person, car, dog, laptop, cup*) and shows how sure it is.
Results are kept in a searchable history and can be exported for spreadsheets or machine-learning datasets.

**The problem.** The previous version sent every image to a paid/rate-limited cloud language model and
returned one sentence about the "main object", with a hard-coded 99% confidence. It needed an account
for anything, had no real bounding boxes, and stopped working when the API key or free quota ran out.
People who just want to know *what is in this frame and where* had no fast, private, free option.

**Who it is for.**

| Persona | Context | What they need |
|---|---|---|
| **Riya, B.Tech student (Pune)** | Final-year computer-vision project, cheap Android phone, patchy college Wi-Fi | A detector that runs on the phone, works offline in the lab, and exports COCO/CSV she can put in her report |
| **Arjun, shop owner (Surat)** | Small electronics shop, wants to count people walking past the counter and check shelf items | Live camera counts per class, no subscription, nothing uploaded to unknown servers |
| **Meera, ML engineer** | Builds training datasets | Quick pre-labels with boxes in COCO format, adjustable threshold, batch upload |
| **Teacher / demo audience** | Explains "what is object detection" in a class | Instant, visual, works on the projector laptop, tells them the model, latency and backend |

## 2. Goals, success metrics, non-goals

**Goals**
1. Real object detection (boxes + labels + confidence) with **no API key and no upload**.
2. Works on phones, including the rear camera, and offline after the first visit.
3. Results are durable and portable: history, export, optional cloud sync.
4. Keep every capability of the old app (accounts with OTP, AI explanation with translation and read-aloud, history, analytics, profile).

**Success metrics** (measured on a production build)
- First detection on a 600×400 photo in **< 2 s** after the model is cached, on a mid-range laptop.
- Live camera at **≥ 8 fps** on a laptop with WebGL.
- Model never blocks first paint: landing and console pages paint before any TensorFlow.js code is downloaded.
- Lighthouse mobile: **Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, Performance ≥ 90** (target; see §8).
- 0 horizontal overflow at 360/390/768/1024/1280/1536 px.

**Non-goals (this release)**
- Training or fine-tuning models, custom classes beyond COCO-80.
- Object tracking IDs across frames, video export with burned-in boxes.
- Server-side inference, team workspaces, sharing links, payments.

## 3. Scope

**In scope:** landing page; console (overview, live scan, upload with video, history + detail, analytics, settings);
in-browser COCO-SSD detection; class filter; export/import; optional Supabase accounts (OTP sign-up, sign-in,
password reset, profile, cloud sync); optional AI description via OpenRouter; PWA; light/dark themes; API rate limits.

**Out of scope:** native apps, admin panel, analytics across users, email notifications other than OTP and password reset.

## 4. Features

Each feature lists user stories and acceptance criteria (AC). "Guest" = not signed in.

### F-01 Landing page
- As a first-time visitor I want to understand in seconds what VisionAI does and start using it, so that I don't need to sign up first.
- AC
  - [ ] Hero states the value (on-device detection, no upload, no key) and has two CTAs: *Start a live scan* → `/dashboard/webcam`, *Analyse a photo* → `/dashboard/upload`.
  - [ ] Hero visual shows labelled boxes without loading the model (pure SVG/CSS).
  - [ ] Sections: pipeline (5 steps), spec sheet (model, classes, runtime, latency, privacy, offline, output, export), workflows, class index of all 80 classes with their box colours, CTA, footer.
  - [ ] Mobile nav works without JavaScript (disclosure menu); all touch targets ≥ 44 px.

### F-02 In-browser detector
- As any user I want detection to run on my device so that my images stay private and it works without a key.
- AC
  - [ ] TensorFlow.js + COCO-SSD are loaded with dynamic `import()` only on detection pages, starting at the first user interaction or the first scan request — never during first paint.
  - [ ] Backend is WebGL, falling back to CPU automatically; the active backend is shown.
  - [ ] Two models selectable: *Lite* (SSDLite MobileNet v2, default) and *Full* (SSD MobileNet v2).
  - [ ] A model status widget shows idle / loading (with stage) / ready (backend + load time) / error with *Retry*.
  - [ ] The model is warmed up once so the first real scan is fast; weights are cached for offline use (see F-22).

### F-03 Live camera scan
- As Arjun I want to point my phone at the counter and see boxes and counts live, so that I can count people and items.
- AC
  - [ ] *Start camera* asks for permission and starts the rear camera on phones (`facingMode: environment`); *Flip* switches front/rear; a device picker appears when there are 2+ cameras.
  - [ ] Boxes and labels are drawn every frame on an overlay that stays aligned at any size (`object-fit: contain`), labels stay readable on phones.
  - [ ] HUD shows LIVE/PAUSED, backend, latency and fps; side panel lists objects in frame sorted by confidence.
  - [ ] *Pause* freezes the frame; *Capture* saves the frame with all detections to history (keyboard: Space = pause, C = capture).
  - [ ] Front camera can be mirrored (setting); saved captures keep what the user saw (boxes mirrored too).
  - [ ] Clear error messages for: permission denied, no camera, camera busy, insecure context (HTTP).
  - [ ] Detection pauses while the tab is hidden; the camera stops when leaving the page.

### F-04 Photo upload
- As Meera I want to drop a batch of photos and get boxes for each, so that I can pre-label a dataset.
- AC
  - [ ] Accepts images by file picker (multiple), drag-and-drop and clipboard paste; rejects non-images and files > 50 MB with a message.
  - [ ] Images are processed one after another with a visible queue (queued / running / done / error) and per-image object counts.
  - [ ] Selecting an image shows it with the overlay, a class summary, the detection table and per-image actions.
  - [ ] With *Save uploads automatically* on (default) every result is saved to history; otherwise *Save* saves it.
  - [ ] Images never leave the device unless the user is signed in (sync) or asks for an AI description.

### F-05 Video file analysis
- As Riya I want to scrub through a recorded clip and see detections, so that I can pick frames for my report.
- AC
  - [ ] A dropped video plays with native controls; detection runs on each displayed frame while playing, and on seek.
  - [ ] *Capture frame* saves the current frame (named `file @ m:ss`) with detections to history.

### F-06 Detection results display
- As any user I want to read the result precisely, so that I can trust and reuse it.
- AC
  - [ ] Each box shows class colour, label and confidence in %; corner ticks mark the box.
  - [ ] Each class keeps one distinct colour everywhere (overlay, lists, charts, class index); adjacent COCO classes never share a colour.
  - [ ] Detection table: label, score (with bar), `x, y, w, h` in image pixels; hovering or focusing a row highlights its box and vice versa.
  - [ ] Class summary chips show counts per class (e.g. *person ×4*).

### F-07 Confidence threshold and detection settings
- As Meera I want to tune what counts as a detection, so that I control precision vs recall.
- AC
  - [ ] Threshold slider 0.20–0.95 (step 0.05) on live, upload and detail pages; changes apply instantly without re-running the model.
  - [ ] Detector keeps everything ≥ 0.20, so lowering the threshold later reveals more boxes; each saved scan stores its own threshold.
  - [ ] Settings: default threshold, max boxes per frame (5–50), show labels on/off, mirror front camera, auto-save uploads, model; *Restore defaults*.

### F-08 Class filter
- As Arjun I want to detect only the classes I care about (e.g. *person*), so that the view and counts aren't cluttered.
- AC
  - [ ] Settings → Detection has a class filter: pick any of the 80 classes (searchable, grouped), or *All classes*.
  - [ ] When a filter is set, the live overlay and in-frame list, the video overlay and the upload overlay, table and counts show only those classes; a badge on live scan and upload says *n classes* with a link to change it and a button to clear it.
  - [ ] Saved scans always keep all raw detections; history, detail and exports are not filtered, so nothing is lost.

### F-09 Scan history (on device)
- As a guest I want my scans kept on this device, so that I can come back to them without an account.
- AC
  - [ ] Every saved scan stores: id, time, source (camera/upload/video), file name, size, 320 px thumbnail, full image (≤ 1280 px JPEG), raw detections, threshold, latency, model, backend, optional AI result.
  - [ ] History grid with search by label or file name, filter by source, sort (newest, oldest, most objects), result count.
  - [ ] *Clear history* asks for confirmation and states how many scans will be deleted.
  - [ ] Works offline; shows a designed empty state with CTAs and import.

### F-10 Scan detail
- AC
  - [ ] `/dashboard/history/[id]` shows the image with overlay, per-scan threshold slider (persisted on release), detection table, metadata (time, source, size, model, backend, inference time, storage location) and the AI panel.
  - [ ] Actions: export (PNG/CSV/COCO/JSON), sync (if signed in and not synced), delete with confirmation (also deletes the cloud copy).
  - [ ] Unknown ids show *Scan not found* with a link back.

### F-11 Export and import
- As Meera I want standard formats, so that I can use results in Excel, Python or labelling tools.
- AC
  - [ ] CSV: one row per visible detection with scan id, ISO time, source, file, image size, model, backend, latency, label, score, x, y, width, height.
  - [ ] COCO JSON: `images`, `annotations` (bbox `[x,y,w,h]`, area, score, official COCO category id) and all 80 `categories`.
  - [ ] VisionAI JSON: full records incl. thumbnails; can be re-imported on another device (*Import JSON*).
  - [ ] Annotated PNG at full stored resolution with boxes burned in.
  - [ ] Export from a single scan, the current upload batch, the filtered history list and analytics.

### F-12 Analytics
- AC
  - [ ] KPI tiles: scans, objects, classes seen (of 80), average confidence.
  - [ ] Charts: objects per day (7/14/30 days), confidence histogram (0.2–1.0), class frequency (top 12), median inference time per backend, scans per source.
  - [ ] Computed locally from history; empty state when no data.

### F-13 Console overview
- AC
  - [ ] Greeting (time of day, first name when signed in), quick actions (Live scan, Upload), KPI tiles with animated numbers, 6 most recent scans, top classes, detector status.

### F-14 Describe with AI (optional)
- As a teacher I want a written explanation of what's in a frame, in Hindi, read aloud, so that students understand it.
- AC
  - [ ] Available on live scan, upload and scan detail when the server has `OPENROUTER_API_KEY`; otherwise the panel explains it is not configured and detection still works.
  - [ ] *Quick* (1–2 sentences) and *Deep* (detailed analysis, background, 3 examples) modes; 60 languages for the translation.
  - [ ] Falls back through 4 free vision models; shows which one answered.
  - [ ] Read-aloud of the English text and of the translation (Web Speech API, BCP-47 voice per language).
  - [ ] Result is stored on the scan (upload/detail) or offered as *Save frame* (live).

### F-15 Sign up with e-mail OTP (optional accounts)
- AC
  - [ ] Step 1: name, e-mail, password (≥ 8 chars) validated client and server side; a 6-digit code is e-mailed (Mailjet) and expires in 15 minutes.
  - [ ] Step 2: enter the code; on success the account is created (e-mail confirmed), profile row created, user signed in and sent to the console.
  - [ ] Already-registered e-mails are refused; *Resend code* has a 45 s cooldown; codes are cryptographically random.
  - [ ] When accounts aren't configured, the page says so and links to guest mode.

### F-16 Sign in / sign out
- AC
  - [ ] E-mail + password with show/hide; clear error for wrong credentials; on success go to `/dashboard`.
  - [ ] Signed-in users visiting `/login` or `/signup` are redirected to `/dashboard`.
  - [ ] Sign out from the sidebar and from Settings.

### F-17 Password reset
- As a user who forgot my password I want a reset link by e-mail, so that I can get back to my synced scans.
- AC
  - [ ] *Forgot password?* on sign-in leads to `/forgot-password`: enter e-mail → Supabase sends a reset link to `/reset-password`. The response does not reveal whether the e-mail exists.
  - [ ] `/reset-password` accepts a new password (≥ 8, confirmed) when opened from the link, then signs the user in and goes to the console; opened without a valid link it explains and links back.

### F-18 Profile
- AC
  - [ ] Settings → Account (signed in): full name and username (3–32, letters/numbers/._-) editable with validation; duplicate username shows an error; e-mail read-only.

### F-19 Cloud sync (signed in)
- AC
  - [ ] New scans are upserted to Supabase `detections` (same UUID) with the image in the `detections` bucket; synced scans show a cloud badge.
  - [ ] *Sync n to cloud* pushes older local scans; scans from other devices appear in history (cloud-only, image from storage).
  - [ ] Deleting a synced scan deletes the cloud row. Rows are protected by row-level security (owner only).
  - [ ] Legacy rows from the old app (`{object, explanation}`) still appear in history.

### F-20 Settings and data management
- AC
  - [ ] Sections: Appearance, Detection, AI description, Data on this device (count, storage used/quota, *Back up* JSON, *Clear*), Account.
  - [ ] Settings persist in `localStorage` and sync across tabs.

### F-21 Themes
- AC
  - [ ] Light, dark and system; no flash on load; toggle in header/sidebar and a segmented control in Settings; both themes designed separately (DESIGN.md), WCAG AA text contrast.

### F-22 PWA and offline
- AC
  - [ ] Installable (manifest with 192/512/maskable icons, apple-touch-icon, theme colours, shortcuts to Live scan, Upload, History).
  - [ ] Service worker precaches the app shell, caches model weights cache-first, uses network-first for pages, and serves `/offline` when a page isn't cached.
  - [ ] After one online visit with the model loaded, live scan and upload work with the network off.

### F-23 SEO and metadata
- AC
  - [ ] Per-page titles and descriptions, Open Graph image, `sitemap.xml`, `robots.txt` (disallows `/api/`), canonical base from `NEXT_PUBLIC_SITE_URL`.

### F-24 Errors, loading and empty states
- AC
  - [ ] Route-level `loading.tsx` skeletons that match the final layout; `error.tsx` with retry; designed 404; empty states for overview, history, analytics; toasts for every save/export/delete.

### F-25 Abuse protection on server routes
- As the owner I want the paid/side-effect routes protected, so that nobody can spam e-mails or burn the AI quota.
- AC
  - [ ] `/api/auth/send-otp`: max 3 requests per e-mail per 10 min and 10 per IP per hour → HTTP 429 with a readable message and `Retry-After`.
  - [ ] `/api/auth/verify-email`: max 10 attempts per e-mail per 15 min (blocks code guessing).
  - [ ] `/api/analyze`: max 20 requests per IP per 10 min.
  - [ ] All route inputs validated with zod; errors never echo secrets.

## 5. User flows

**A. Guest, first visit, phone (Arjun)**
1. Opens `/` → taps *Start a live scan*. 2. Console opens on Live scan; model status *Loads on demand*.
3. Taps *Start camera* → allows camera → rear camera starts; model loads (stage shown), boxes appear.
4. Opens Settings → class filter → *person*. 5. Back on Live scan: only people are boxed; in-frame list counts them.
6. Taps *Capture* → toast *Frame saved to history* → History shows the scan.

**B. Dataset pre-labelling (Meera, laptop)**
1. `/dashboard/upload` → drags 20 photos. 2. Queue processes them; each is auto-saved.
3. Lowers threshold to 0.35 on one image → more boxes → *Update*.
4. History → search *dog* → Export → COCO annotations.

**C. Report figure (Riya)**
1. Upload → drops `lab-demo.mp4` → plays → pauses at 0:42 → *Capture frame*.
2. History → opens it → Export → Annotated PNG.

**D. Explanation in Hindi (teacher)**
1. Live scan → camera on → AI panel language *Hindi* → *Deep*. 2. Reads explanation, taps speaker for Hindi audio.
3. Taps *Save frame* in the toast → scan saved with the description.

**E. Account and sync**
1. `/signup` → details → code e-mailed → enters code → signed in. 2. Sidebar shows *cloud sync on*.
3. History → *Sync 12 to cloud*. 4. On another device, signs in → those scans appear (cloud badge).
5. Forgot password → `/forgot-password` → link → `/reset-password` → new password → console.

## 6. Screen inventory

| Route | Purpose | Key elements |
|---|---|---|
| `/` | Explain and convert | Hero + viewfinder SVG, pipeline, spec sheet, workflows bento, class index, CTA |
| `/dashboard` | Overview | Greeting, quick actions, KPIs, recent scans, top classes, detector status |
| `/dashboard/webcam` | Live detection | Viewfinder + overlay, HUD, control bar, in-frame list, threshold, camera picker, filter badge, AI panel |
| `/dashboard/upload` | Photos/video | Dropzone, video analyser, queue strip, stage, result panel, table, AI panel |
| `/dashboard/history` | Browse scans | Search, source filter, sort, export, import, clear, sync, card grid |
| `/dashboard/history/[id]` | One scan | Stage, threshold, table, metadata, export, sync, delete, AI panel |
| `/dashboard/analytics` | Charts | Range switch, KPIs, 4 charts, export |
| `/dashboard/settings` | Preferences | Appearance, Detection (incl. class filter), AI, Data, Account/profile |
| `/login`, `/signup` | Accounts | Forms, OTP step, guest link |
| `/forgot-password`, `/reset-password` | Password recovery | E-mail form; new-password form |
| `/offline` | SW fallback | Explanation, links to cached tools |
| 404 / error | Recovery | Designed messages with actions |

## 7. Content and data

- **Real content:** the 80 COCO classes with official ids and supercategories; model names; 60 translation languages with BCP-47 speech tags; product copy written for this product (no lorem ipsum).
- **Entities:** *ScanRecord* (local, IndexedDB), *Detection* (label, score, bbox), *AiAnalysis*, *Settings* (localStorage), *Profile* and *detections* rows (Supabase), *verification_tokens* (Supabase, server only).
- **Sample data:** none is seeded; history starts empty by design (privacy). The landing hero uses an illustrated scene with representative scores.

## 8. Non-functional requirements

- **Responsive:** mobile-first; checked at 360, 390, 768, 1024, 1280, 1536 px; no horizontal scroll; console uses a bottom tab bar < 1024 px and a sidebar ≥ 1024 px; touch targets ≥ 44 px; safe-area insets respected.
- **Themes:** light/dark/system via `next-themes`, no flash; OKLCH tokens tuned per theme.
- **PWA/offline:** see F-22.
- **Performance:** model and Supabase SDK never on the first-paint path; route JS for detection pages loaded on demand. Lighthouse mobile targets ≥ 90 Performance (simulated throttling), ≥ 95 others. *Known: on the shared dev machine the simulated score is 75–82 while observed LCP is ~0.3 s; re-measure on the deployed site.*
- **Accessibility:** WCAG 2.2 AA: semantic landmarks, skip link, labelled controls, visible focus rings, keyboard shortcuts with `aria-keyshortcuts`, live regions for status, `prefers-reduced-motion` honoured.
- **SEO:** F-23.
- **Security/privacy:** images processed locally; nothing uploaded for guests; secrets server-only; RLS on all Supabase tables; zod validation and rate limits on API routes (F-25); security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy: camera=(self)`).

## 9. Risks, assumptions, open questions

- **Assumption:** COCO-80 classes cover the owner's use cases. *Open:* are custom classes (e.g. specific products) needed later? That needs a custom-trained model.
- **Risk:** model weights are fetched from Google Cloud Storage on first use; if blocked on a network, detection fails until it's reachable (cached afterwards). *Option:* self-host weights under `/public/models`.
- **Risk:** rate limits are in-memory per server instance; on serverless with many instances they are best-effort. *Option:* move to Supabase or Upstash for strict limits.
- **Open (owner):** production domain for `NEXT_PUBLIC_SITE_URL`; Supabase redirect URL allow-list must include `/reset-password` on that domain; Mailjet sender address verified; whether the OpenRouter free models are acceptable for production use.
- **Open (owner):** the old `scheduled_sessions` pg_cron job in `supabase_schema.sql` has no product use — keep or drop?
