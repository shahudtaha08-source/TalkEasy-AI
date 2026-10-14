import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

/** Reads width/height straight from the PNG IHDR chunk (no dependencies). */
function pngSize(buf: Buffer): { width: number; height: number } {
  assert.equal(buf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "not a PNG");
  assert.equal(buf.subarray(12, 16).toString("ascii"), "IHDR", "missing IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test("manifest declares TalkEasy branding and a standalone install", () => {
  const manifest = JSON.parse(read("client/public/manifest.webmanifest"));
  assert.equal(manifest.name, "TalkEasy");
  assert.equal(manifest.short_name, "TalkEasy");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#0d9488");
  assert.equal(typeof manifest.background_color, "string");
  assert.ok(manifest.start_url && manifest.start_url.startsWith("/"), "start_url must be same-origin");
  assert.equal(manifest.scope, "/");
});

test("manifest ships real 192 and 512 PNG icons plus a maskable icon", () => {
  const manifest = JSON.parse(read("client/public/manifest.webmanifest"));
  const icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> = manifest.icons;
  assert.ok(Array.isArray(icons) && icons.length >= 3, "expected at least three icons");

  const has = (sizes: string, type: string, purpose?: string) =>
    icons.some((i) => i.sizes === sizes && i.type === type && (!purpose || (i.purpose || "any").includes(purpose)));

  assert.ok(has("192x192", "image/png"), "missing 192x192 PNG icon");
  assert.ok(has("512x512", "image/png"), "missing 512x512 PNG icon");
  assert.ok(has("512x512", "image/png", "maskable"), "missing maskable 512 PNG icon");
});

test("shipped PNG icons exist at the advertised dimensions", () => {
  const expectations: Array<[string, number]> = [
    ["client/public/icons/icon-192.png", 192],
    ["client/public/icons/icon-512.png", 512],
    ["client/public/icons/icon-maskable-512.png", 512],
    ["client/public/icons/apple-touch-icon.png", 180],
  ];
  for (const [rel, size] of expectations) {
    const abs = path.join(root, rel);
    assert.ok(existsSync(abs), `${rel} is missing`);
    const { width, height } = pngSize(readFileSync(abs));
    assert.equal(width, size, `${rel} width`);
    assert.equal(height, size, `${rel} height`);
  }
});

test("HTML shell is mobile-ready and wired to the manifest + icons", () => {
  const html = read("client/index.html");
  assert.match(html, /<meta\s+name="viewport"[^>]*width=device-width/, "missing responsive viewport meta");
  assert.match(html, /rel="manifest"\s+href="\/manifest\.webmanifest"/, "missing manifest link");
  assert.match(html, /rel="apple-touch-icon"\s+href="\/icons\/apple-touch-icon\.png"/, "missing apple-touch-icon");
  assert.match(html, /name="theme-color"\s+content="#0d9488"/, "missing theme-color");
  assert.match(html, /<title>TalkEasy<\/title>/, "title should be TalkEasy");
});

test("service worker handles push, notification clicks and offline fetch safely", () => {
  const sw = read("client/public/sw.js");
  assert.match(sw, /addEventListener\("push"/, "missing push handler");
  assert.match(sw, /addEventListener\("notificationclick"/, "missing notificationclick handler");
  assert.match(sw, /addEventListener\("fetch"/, "missing fetch handler for offline shell");

  // Versioned caches and cleanup on activate (no stale caches after an update).
  assert.match(sw, /CACHE_VERSION/, "cache must be versioned");
  assert.match(sw, /caches\.delete/, "old caches must be deleted on activate");

  // Private data safety: /api/* must never be cached or served from cache.
  assert.match(sw, /pathname\.startsWith\("\/api\/"\)\s*\)\s*return/, "API requests must bypass the cache");

  // Offline shell fallback exists.
  assert.match(sw, /mode === "navigate"/, "navigations must be handled network-first");
});

test("service worker push notification uses the exact reminder message fallback", () => {
  const sw = read("client/public/sw.js");
  assert.match(sw, /Time for your TalkEasy mood check-in\./, "reminder message missing");
  assert.match(sw, /showNotification/, "missing showNotification");
});

test("service worker precaches the hashed build assets so the shell boots offline", () => {
  const sw = read("client/public/sw.js");
  // The HTML shell points at hashed /assets/*.js|css; those must be cached at
  // install, otherwise an offline reload shows the shell but a blank screen.
  assert.match(sw, /assets/, "service worker must cache hashed build assets");
  assert.match(sw, /\.matchAll\(/, "service worker must parse the shell for asset URLs");
  assert.match(sw, /\bRUNTIME_CACHE\b/, "asset precache must use the runtime cache the fetch handler reads");
});
