// End-to-end smoke test over the Chrome DevTools Protocol (no extra packages; Node ≥ 22 for global WebSocket).
// Usage: start the app (npm run build && npm start), then:
//   BASE_URL=http://localhost:3000 npm run e2e
// Env: BASE_URL, CHROME_PATH, CDP_PORT (default 9757), SHOTS_DIR (optional: save screenshots there).
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PORT = Number(process.env.CDP_PORT ?? 9757);
const SHOTS = process.env.SHOTS_DIR;
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome");
const SAMPLE = "https://raw.githubusercontent.com/tensorflow/tfjs-models/master/coco-ssd/demo/image1.jpg";

const profile = mkdtempSync(join(tmpdir(), "visionai-e2e-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run",
  "--no-default-browser-check", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
  "--enable-unsafe-swiftshader", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures.push(msg);
};

let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page");
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {}
  if (!ws) await sleep(500);
}
if (!ws) throw new Error(`Chrome did not start on port ${PORT}`);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method === "Runtime.exceptionThrown") {
    errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200));
  } else if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/404/.test(m.params.entry.text)) {
    errors.push(m.params.entry.text.slice(0, 200));
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const view = async (width, height, dark = false) => {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] });
};
const go = async (path, wait = 2000) => {
  await send("Page.navigate", { url: BASE + path });
  await sleep(wait);
};
const text = () => evaluate(`document.querySelector("main")?.innerText ?? ""`);
const shot = async (name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(r.result.data, "base64"));
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

try {
  // 1. Every page renders without horizontal overflow at phone, tablet and desktop widths.
  const pages = ["/", "/dashboard", "/dashboard/webcam", "/dashboard/upload", "/dashboard/history", "/dashboard/analytics",
    "/dashboard/settings", "/login", "/signup", "/forgot-password", "/reset-password", "/offline"];
  for (const [w, h] of [[360, 780], [390, 844], [768, 1024], [1280, 860]]) {
    await view(w, h, w === 390);
    for (const p of pages) {
      await go(p, 1500);
      const o = await evaluate(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
      check(o && o.sw <= o.cw, `${p} @${w}px no horizontal overflow (${o?.sw}/${o?.cw})`);
    }
  }

  // 2. Upload a sample photo → detections found and saved.
  await view(1280, 860);
  await go("/dashboard/upload", 2500);
  await evaluate(`(async () => { const b = await (await fetch(${JSON.stringify(SAMPLE)})).blob();
    const dt = new DataTransfer(); dt.items.add(new File([b], "kites.jpg", { type: "image/jpeg" }));
    const i = document.getElementById("file-input"); i.files = dt.files; i.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  let t = "";
  for (let i = 0; i < 120 && !/\d+ objects?\b/.test(t); i++) {
    await sleep(1000);
    t = await text();
  }
  const objects = Number(/(\d+) objects?\b/.exec(t)?.[1] ?? 0);
  check(objects >= 3, `upload detects objects in the sample photo (${objects})`);
  check(/person/.test(t), "upload result includes 'person'");
  check(/saved/.test(t), "upload result auto-saved to history");
  await shot("upload");

  // 3. Class filter narrows the view.
  await evaluate(`(() => { const k = "visionai.settings.v1"; const s = JSON.parse(localStorage.getItem(k) || "{}"); s.classFilter = ["kite"]; localStorage.setItem(k, JSON.stringify(s)); })()`);
  await go("/dashboard/history", 2500);
  const scanId = await evaluate(`document.querySelector('a[href^="/dashboard/history/"]')?.getAttribute("href")`);
  check(Boolean(scanId), "history lists the saved scan");
  await go(scanId ?? "/dashboard/history", 3000);
  const detail = await text();
  check(/person/.test(detail) && /kite/.test(detail), "scan detail shows all classes regardless of the filter");
  await evaluate(`(() => { const k = "visionai.settings.v1"; const s = JSON.parse(localStorage.getItem(k)); s.classFilter = []; localStorage.setItem(k, JSON.stringify(s)); })()`);
  await shot("detail");

  // 4. Analytics and overview reflect the scan.
  await go("/dashboard/analytics", 2500);
  check(/Class frequency/.test(await text()), "analytics renders charts");
  await go("/dashboard", 2500);
  check(/1 scan\b/.test(await text()), "overview counts the scan");

  // 5. Live camera starts with Chrome's fake device and the detection loop runs.
  await go("/dashboard/webcam", 2500);
  await evaluate(`[...document.querySelectorAll("button")].find((b) => /Start camera/.test(b.textContent))?.click()`);
  let live = "";
  for (let i = 0; i < 60 && !/[1-9][\d.]* fps/.test(live); i++) {
    await sleep(1000);
    live = await text();
  }
  check(/[1-9][\d.]* fps/.test(live), `live detection loop runs (${/([\d.]+) fps/.exec(live)?.[1] ?? 0} fps)`);
  await shot("webcam");

  // 6. PWA: service worker registers and activates.
  await go("/", 5000);
  const sw = await evaluate(`navigator.serviceWorker.getRegistrations().then((r) => r.some((x) => x.active))`);
  check(Boolean(sw), "service worker active");

  // 7. API contract: AI status endpoint.
  const status = await evaluate(`fetch("/api/analyze").then((r) => r.json())`);
  check(status && typeof status.configured === "boolean", "GET /api/analyze returns { configured }");

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  ws.close();
  chrome.kill();
  await sleep(800);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
