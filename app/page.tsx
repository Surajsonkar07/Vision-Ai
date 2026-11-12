import Link from "next/link";
import { ArrowRight, Camera, ImageUp, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { RevealController } from "@/components/reveal";
import { Viewfinder } from "@/components/landing/viewfinder";
import { COCO_GROUPS } from "@/lib/coco";
import { classColor } from "@/lib/colors";

const PIPELINE = [
  {
    step: "Capture",
    detail: "A frame from your camera, a photo or a paused video. Phones use the rear camera by default.",
    meta: "getUserMedia · File API",
  },
  {
    step: "Tensor",
    detail: "Pixels are copied to the GPU and resized to the network's 300 × 300 input.",
    meta: "TensorFlow.js · WebGL",
  },
  {
    step: "Infer",
    detail: "A single-shot detector predicts boxes and class scores for all 80 COCO classes in one pass.",
    meta: "SSD · MobileNet v2",
  },
  {
    step: "Filter",
    detail: "Overlapping boxes are merged by non-max suppression; anything under your threshold is dropped.",
    meta: "NMS · score ≥ threshold",
  },
  {
    step: "Record",
    detail: "Boxes are drawn over the frame, and the scan is saved to on-device history for export.",
    meta: "IndexedDB · JSON / CSV / COCO",
  },
];

const SPECS: [string, string][] = [
  ["Model", "COCO-SSD — SSDLite MobileNet v2 (default) or SSD MobileNet v2"],
  ["Classes", "80 everyday categories, from person and car to toothbrush"],
  ["Runtime", "TensorFlow.js in the browser — WebGL, CPU fallback"],
  ["Typical latency", "20–60 ms per frame on a recent laptop, 60–150 ms on a phone"],
  ["Data leaving the device", "None. Frames are never uploaded unless you ask AI to describe one"],
  ["Offline", "Yes, once the model has been fetched — installable as an app"],
  ["Output", "Label, confidence and [x, y, width, height] per object"],
  ["Export", "VisionAI JSON, CSV per detection, COCO annotations, annotated PNG"],
];

export default function HomePage() {
  return (
    <>
      <RevealController />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link prefetch={false} href="/" aria-label="VisionAI home" className="rounded-sm">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {[
              ["#pipeline", "How it works"],
              ["#specs", "Specs"],
              ["#workflows", "Workflows"],
              ["#classes", "Classes"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link prefetch={false}
              href="/dashboard"
              className="hidden h-10 items-center gap-2 rounded-sm bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:inline-flex"
            >
              Open console
            </Link>
            <details className="group relative md:hidden">
              <summary
                aria-label="Menu"
                className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
              >
                <Menu className="size-5" />
              </summary>
              <div className="absolute right-0 top-12 w-56 rounded-md border border-border bg-surface p-1.5 shadow-pop">
                {[
                  ["#pipeline", "How it works"],
                  ["#specs", "Specs"],
                  ["#workflows", "Workflows"],
                  ["#classes", "Classes"],
                  ["/dashboard", "Open console"],
                  ["/login", "Sign in"],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="flex h-11 items-center rounded-sm px-3 text-sm hover:bg-surface-2">
                    {label}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
            <div className="motion-safe:animate-enter">
              <p className="eyebrow">On-device object detection · 80 classes</p>
              <h1 className="mt-5 text-[2.5rem] leading-[1.02] font-bold sm:text-6xl lg:text-[4.1rem]">
                See what&apos;s in the frame. <span className="text-muted-foreground">Keep the frame.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                VisionAI runs a neural detector inside your browser. Point a phone camera or drop in a photo and get
                labelled bounding boxes with confidence scores in milliseconds — nothing is uploaded, and no API key
                is needed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link prefetch={false}
                  href="/dashboard/webcam"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Camera className="size-4" aria-hidden /> Start a live scan
                </Link>
                <Link prefetch={false}
                  href="/dashboard/upload"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-border-strong bg-surface px-5 font-medium transition-colors hover:bg-surface-2"
                >
                  <ImageUp className="size-4" aria-hidden /> Analyse a photo
                </Link>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 border-y border-border py-4">
                {[
                  ["80", "object classes"],
                  ["0", "bytes uploaded"],
                  ["~30 ms", "per frame"],
                ].map(([v, l]) => (
                  <div key={l} className="border-l border-border pl-3 first:border-l-0 first:pl-0">
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-display text-2xl font-semibold [font-stretch:112%] sm:text-[1.75rem]">{v}</dd>
                    <dd className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="motion-safe:animate-enter [animation-delay:80ms]">
              <Viewfinder />
            </div>
          </div>
        </section>

        {/* PIPELINE */}
        <section id="pipeline" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr] md:items-end" data-reveal>
              <div>
                <p className="eyebrow">01 — How it works</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Five steps, one device.</h2>
              </div>
              <p className="text-muted-foreground md:max-w-lg md:justify-self-end">
                The whole pipeline runs where the image already is. The browser downloads the model once, caches it, and
                every frame after that stays on your machine.
              </p>
            </div>
            <ol className="mt-12 grid grid-cols-1 border-t border-border md:grid-cols-5">
              {PIPELINE.map((p, i) => (
                <li
                  key={p.step}
                  data-reveal
                  style={{ ["--reveal-i" as string]: i }}
                  className="relative grid grid-cols-[3rem_1fr] gap-x-3 border-b border-border py-6 md:block md:border-b-0 md:border-l md:px-5 md:py-8 md:first:border-l-0 md:first:pl-0"
                >
                  <span className="readout text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg font-semibold md:mt-6">{p.step}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{p.detail}</p>
                    <p className="readout mt-4 text-xs text-muted-foreground">{p.meta}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SPECS */}
        <section id="specs" className="border-b border-border bg-surface">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal>
              <p className="eyebrow">02 — Spec sheet</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Measured, not magic.</h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                COCO-SSD is a well-understood, openly licensed detector. It won&apos;t name a dog&apos;s breed, but it will
                find the dog, the frisbee and the person throwing it — fast enough to keep up with a moving camera.
              </p>
              <p className="mt-4 max-w-md text-muted-foreground">
                Need more than a box? With a server key, <strong className="font-medium text-foreground">Describe with AI</strong>{" "}
                sends one chosen frame to a vision-language model and returns an explanation in 60 languages.
              </p>
            </div>
            <dl className="divide-y divide-border border-y border-border" data-reveal>
              {SPECS.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="readout text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-[0.9375rem]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* WORKFLOWS — bento */}
        <section id="workflows" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <div data-reveal>
              <p className="eyebrow">03 — Workflows</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">From a quick look to a labelled dataset.</h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-6" data-reveal>
              <article className="bg-background p-6 md:col-span-4 md:p-8">
                <p className="readout text-xs text-primary">LIVE</p>
                <h3 className="mt-3 text-xl font-semibold">Live camera, laptop or phone</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Boxes follow objects as you move. Switch to the rear camera, pause on a frame, tune the threshold, and
                  capture any moment to history with one tap.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2 readout text-xs sm:max-w-md">
                  {[
                    ["fps", "24.0"],
                    ["latency", "38 ms"],
                    ["objects", "3"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-sm border border-border px-3 py-2">
                      <div className="text-muted-foreground">{k}</div>
                      <div className="mt-1 text-base text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="bg-background p-6 md:col-span-2 md:p-8">
                <p className="readout text-xs text-primary">UPLOAD</p>
                <h3 className="mt-3 text-xl font-semibold">Photos &amp; video</h3>
                <p className="mt-2 text-muted-foreground">
                  Drop a batch of images, paste from the clipboard, or play a clip and detect frame by frame.
                </p>
                <p className="readout mt-6 text-xs text-muted-foreground">jpg · png · webp · gif · mp4 · webm</p>
              </article>
              <article className="bg-background p-6 md:col-span-3 md:p-8">
                <p className="readout text-xs text-primary">EXPORT</p>
                <h3 className="mt-3 text-xl font-semibold">History you can take with you</h3>
                <p className="mt-2 text-muted-foreground">
                  Every scan is kept on this device. Search by label, then export CSV, COCO annotations or annotated PNGs.
                </p>
                <pre className="mt-6 overflow-x-auto rounded-sm border border-border bg-surface-2 p-3 readout text-[0.6875rem] leading-relaxed text-muted-foreground sm:text-xs">
{`label,score,x,y,width,height
laptop,0.9412,100.0,178.0,312.0,178.0
cup,0.8805,404.0,270.0,66.0,86.0`}
                </pre>
              </article>
              <article className="bg-background p-6 md:col-span-3 md:p-8">
                <p className="readout text-xs text-primary">DESCRIBE</p>
                <h3 className="mt-3 text-xl font-semibold">Ask for an explanation, in your language</h3>
                <p className="mt-2 text-muted-foreground">
                  Optional: send one frame to a vision model for a written description and translation, then have it
                  read aloud.
                </p>
                <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Example languages">
                  {["English", "हिन्दी", "Español", "தமிழ்", "日本語", "Français", "বাংলা", "+53"].map((l) => (
                    <li key={l} className="rounded-xs border border-border px-2 py-1 text-xs text-muted-foreground">
                      {l}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* CLASSES */}
        <section id="classes" className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end" data-reveal>
              <div>
                <p className="eyebrow">04 — Class index</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">What it can find.</h2>
              </div>
              <p className="text-muted-foreground md:justify-self-end md:text-right">
                The 80 COCO categories. Each class keeps one box colour everywhere in the app.
              </p>
            </div>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {COCO_GROUPS.map(({ group, classes }) => (
                <div key={group} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[9rem_1fr]" data-reveal>
                  <p className="readout text-sm text-muted-foreground">
                    {group} <span className="opacity-60">· {classes.length}</span>
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {classes.map((c) => (
                      <li key={c} className="inline-flex items-center gap-1.5 rounded-xs border border-border bg-background px-2 py-1 text-sm">
                        <span className="size-2 rounded-[1px]" style={{ background: classColor(c) }} aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-foreground text-background">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Open the console. Point at something.</h2>
              <p className="mt-3 max-w-xl opacity-75">
                No account needed — history stays on this device. Sign in later to sync scans across devices.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link prefetch={false}
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-[oklch(0.885_0.19_124)] px-5 font-medium text-[oklch(0.2_0.04_130)] transition-opacity hover:opacity-90"
              >
                Open console <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link prefetch={false}
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-sm border border-background/30 px-5 font-medium transition-colors hover:bg-background/10"
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p className="readout text-xs">COCO-SSD · TensorFlow.js · runs on your device</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link prefetch={false} href="/dashboard" className="hover:text-foreground">Console</Link>
            <Link prefetch={false} href="/login" className="hover:text-foreground">Sign in</Link>
            <Link prefetch={false} href="/dashboard/settings" className="hover:text-foreground">Settings</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
